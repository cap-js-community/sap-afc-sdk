package com.github.capjscommunity.sapafcsdk.test;

import static com.github.capjscommunity.sapafcsdk.model.cds.outbox.Outbox_.MESSAGES;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
import org.junit.jupiter.api.Assertions;

public class OutboxTestSetup {

  private boolean active = true;
  private final PersistenceService persistenceService;

  public String serviceName;
  public String eventName;
  public CqnService service;
  public List<JSONObject> messageEvents;
  public CountDownLatch messageFinished;
  public CountDownLatch eventTriggered;

  public OutboxTestSetup(
    String serviceName,
    String eventName,
    CdsRuntime cdsRuntime,
    PersistenceService persistenceService
  ) {
    this.persistenceService = persistenceService;
    this.persistenceService.run(Delete.from(MESSAGES));

    OutboxService outboxService = cdsRuntime
      .getServiceCatalog()
      .getService(OutboxService.class, OutboxService.PERSISTENT_ORDERED_NAME);
    CqnService service = outboxService.outboxed(
      cdsRuntime.getServiceCatalog().getService(CqnService.class, serviceName)
    );
    this.serviceName = serviceName;
    this.eventName = eventName;
    this.service = service;
    this.messageEvents = new ArrayList<>();
    this.messageFinished = new CountDownLatch(1);
    this.eventTriggered = new CountDownLatch(1);

    this.persistenceService.after(CqnService.EVENT_CREATE, Messages_.CDS_NAME, context -> {
      if (!this.active) {
        return;
      }
      String message = ((CdsCreateEventContextImpl) context).getCqn().entries().get(0).get("msg").toString();
      JSONObject object = Assertions.assertDoesNotThrow(() -> new JSONObject(message));
      this.messageEvents.add(object);
    });

    this.persistenceService.after(CqnService.EVENT_DELETE, Messages_.CDS_NAME, context -> {
      if (!this.active) {
        return;
      }
      context
        .getChangeSetContext()
        .register(
          new ChangeSetListener() {
            @Override
            public void afterClose(boolean completed) {
              OutboxTestSetup.this.messageFinished.countDown();
            }
          }
        );
    });

    if (eventName != null) {
      this.service.before(eventName, null, context -> {
        if (!this.active) {
          return;
        }
        try {
          assertTrue(this.eventTriggered.await(3, TimeUnit.SECONDS), "event triggered latch timed out");
        } catch (InterruptedException e) {
          throw new RuntimeException(e);
        }
      });
    }
  }

  public void end() {
    this.active = false;
    this.persistenceService.run(Delete.from(MESSAGES));
  }
}
