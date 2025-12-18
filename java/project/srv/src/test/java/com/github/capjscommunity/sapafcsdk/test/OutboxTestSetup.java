package com.github.capjscommunity.sapafcsdk.test;

import static com.github.capjscommunity.sapafcsdk.model.cds.outbox.Outbox_.MESSAGES;

import com.github.capjscommunity.sapafcsdk.model.cds.outbox.Messages_;
import com.sap.cds.ql.Delete;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.changeset.ChangeSetListener;
import com.sap.cds.services.impl.cds.CdsCreateEventContextImpl;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

public class OutboxTestSetup implements AutoCloseable {

  private volatile boolean active = true;
  private final PersistenceService persistenceService;

  public final List<JSONObject> messageEvents = new ArrayList<>();
  public final CountDownLatch messageCreated = new CountDownLatch(1);
  public final CountDownLatch messageDeleted = new CountDownLatch(1);

  public final long Timeout = 10;

  public OutboxTestSetup(String serviceName, CdsRuntime cdsRuntime, PersistenceService persistenceService) {
    this.persistenceService = persistenceService;
    this.persistenceService.run(Delete.from(MESSAGES));

    OutboxService outboxService = cdsRuntime
      .getServiceCatalog()
      .getService(OutboxService.class, OutboxService.PERSISTENT_ORDERED_NAME);
    outboxService.outboxed(cdsRuntime.getServiceCatalog().getService(CqnService.class, serviceName));

    this.persistenceService.after(CqnService.EVENT_CREATE, Messages_.CDS_NAME, context -> {
      if (!active) {
        return;
      }
      String message = ((CdsCreateEventContextImpl) context).getCqn().entries().getFirst().get("msg").toString();
      messageEvents.add(new JSONObject(message));
      try {
        Thread.sleep(100);
      } catch (InterruptedException ignored) {}
      messageCreated.countDown();
    });

    this.persistenceService.after(CqnService.EVENT_DELETE, Messages_.CDS_NAME, context -> {
      if (!active) {
        return;
      }
      context
        .getChangeSetContext()
        .register(
          new ChangeSetListener() {
            @Override
            public void afterClose(boolean completed) {
              try {
                Thread.sleep(100);
              } catch (InterruptedException ignored) {}
              messageDeleted.countDown();
            }
          }
        );
    });
  }

  public List<JSONObject> awaitCompleted() throws InterruptedException {
    if (!messageCreated.await(Timeout, TimeUnit.SECONDS)) {
      throw new AssertionError("Timed out waiting for outbox CREATE");
    }
    if (!messageDeleted.await(Timeout, TimeUnit.SECONDS)) {
      throw new AssertionError("Timed out waiting for outbox DELETE");
    }
    return messageEvents;
  }

  @Override
  public void close() {
    active = false;
  }
}
