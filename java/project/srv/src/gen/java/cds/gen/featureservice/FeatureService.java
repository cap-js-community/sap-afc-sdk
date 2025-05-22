package cds.gen.featureservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.services.cds.ApplicationService;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.cds.RemoteService;
import java.lang.String;
import javax.annotation.processing.Generated;

@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
@CdsName(FeatureService_.CDS_NAME)
public interface FeatureService extends CqnService {
  @CdsName(RedisSendCommandContext.CDS_NAME)
  String redisSendCommand(
      @CdsName(RedisSendCommandContext.COMMAND) RedisSendCommandContext.Command command);

  @CdsName(RedisReadContext.CDS_NAME)
  RedisReadContext.ReturnType redisRead();

  @CdsName(RedisUpdateContext.CDS_NAME)
  void redisUpdate(@CdsName(RedisUpdateContext.NEW_VALUES) RedisUpdateContext.NewValues newValues);

  @CdsName(StateContext.CDS_NAME)
  StateContext.ReturnType state();

  interface Application extends ApplicationService, FeatureService {
  }

  interface Remote extends RemoteService, FeatureService {
  }
}
