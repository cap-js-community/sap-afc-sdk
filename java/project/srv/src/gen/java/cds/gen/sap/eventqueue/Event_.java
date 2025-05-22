package cds.gen.sap.eventqueue;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import java.lang.Integer;
import java.lang.String;
import java.time.Instant;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("sap.eventqueue.Event")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Event_ extends StructuredType<Event_> {
  String ID = "ID";

  String CDS_NAME = "sap.eventqueue.Event";

  @CdsName(ID)
  ElementRef<String> ID();

  ElementRef<String> type();

  ElementRef<String> subType();

  ElementRef<String> referenceEntity();

  ElementRef<String> referenceEntityKey();

  ElementRef<Integer> status();

  ElementRef<String> payload();

  ElementRef<Integer> attempts();

  ElementRef<Instant> lastAttemptTimestamp();

  ElementRef<Instant> createdAt();

  ElementRef<Instant> startAfter();

  ElementRef<String> context();

  ElementRef<String> error();
}
