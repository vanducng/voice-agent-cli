import { getTwilioClient } from "../../services/client";
import {
  listCredentialAssociations,
  CREDENTIAL_FIELDS,
  type CredentialAssociationView,
} from "../../services/association-views";
import {
  CliFailure,
  handleTwilioError,
  outputJson,
} from "../../services/errors";
import { parseFields, sid } from "../../services/query";

export async function listCredentialsCommand(
  trunkId: string,
  options: { limit?: string; paginationKey?: string; fields?: string } = {},
): Promise<void> {
  try {
    const trunkSid = sid(trunkId, "trunk", "Trunk");
    const fields = parseFields(options.fields, CREDENTIAL_FIELDS);
    outputJson(
      await listCredentialAssociations(getTwilioClient(), trunkSid, {
        ...options,
        fields,
      }),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}

async function readCredentials(
  trunkSid: string,
): Promise<CredentialAssociationView[]> {
  const page = await listCredentialAssociations(getTwilioClient(), trunkSid, {
    limit: "1000",
  });
  return page.items;
}

export async function associateCredentialCommand(
  trunkId: string,
  options: { credentialList: string; dryRun?: boolean },
): Promise<void> {
  let trunkSid = "";
  let credentialSid = "";
  let before: CredentialAssociationView[] = [];
  try {
    trunkSid = sid(trunkId, "trunk", "Trunk");
    credentialSid = sid(
      options.credentialList,
      "credential",
      "Credential list",
    );
    before = await readCredentials(trunkSid);
    if (options.dryRun) {
      const after = before.some((item) => item.sid === credentialSid)
        ? before
        : [...before, { sid: credentialSid, friendly_name: null }];
      outputJson({ dry_run: true, trunk_sid: trunkSid, before, after });
      return;
    }
  } catch (error) {
    handleTwilioError(error);
  }

  try {
    const client = getTwilioClient();
    if (!before.some((item) => item.sid === credentialSid)) {
      await client.trunking.v1.trunks(trunkSid).credentialsLists.create({
        credentialListSid: credentialSid,
      });
    }
    const after = (
      await listCredentialAssociations(client, trunkSid, { limit: "1000" })
    ).items;
    if (!after.some((item) => item.sid === credentialSid)) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The credential list read-back does not include the association.",
        false,
        [
          "Read the trunk credential lists again before another write.",
          "Do not associate the list again until that read shows it is absent.",
        ],
      );
    }
    outputJson({ dry_run: false, trunk_sid: trunkSid, before, after });
  } catch (error) {
    handleTwilioError(error, { mutating: true });
  }
}

export async function removeCredentialCommand(
  trunkId: string,
  credentialId: string,
  options: { dryRun?: boolean } = {},
): Promise<void> {
  let trunkSid = "";
  let credentialSid = "";
  let before: CredentialAssociationView[] = [];
  try {
    trunkSid = sid(trunkId, "trunk", "Trunk");
    credentialSid = sid(credentialId, "credential", "Credential list");
    before = await readCredentials(trunkSid);
    if (!before.some((item) => item.sid === credentialSid)) {
      throw new CliFailure(
        "NOT_FOUND",
        "Credential list association was not found.",
        false,
        ["Read the trunk credential lists and use a SID from that read."],
      );
    }
    if (options.dryRun) {
      outputJson({
        dry_run: true,
        trunk_sid: trunkSid,
        before,
        after: before.filter((item) => item.sid !== credentialSid),
      });
      return;
    }
  } catch (error) {
    handleTwilioError(error);
  }

  try {
    const client = getTwilioClient();
    await client.trunking.v1
      .trunks(trunkSid)
      .credentialsLists(credentialSid)
      .remove();
    const after = (
      await listCredentialAssociations(client, trunkSid, { limit: "1000" })
    ).items;
    if (after.some((item) => item.sid === credentialSid)) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The credential list read-back still includes the association.",
        false,
        [
          "Read the trunk credential lists again before another write.",
          "Do not remove the list again until that read shows it is still present.",
        ],
      );
    }
    outputJson({ dry_run: false, trunk_sid: trunkSid, before, after });
  } catch (error) {
    handleTwilioError(error, { mutating: true });
  }
}
