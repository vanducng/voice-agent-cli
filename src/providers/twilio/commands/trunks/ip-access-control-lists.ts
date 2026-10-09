import { getTwilioClient } from "../../services/client";
import {
  IP_ACL_FIELDS,
  listIpAccessControlLists,
  type IpAccessControlListView,
} from "../../services/association-views";
import {
  CliFailure,
  handleTwilioError,
  outputJson,
} from "../../services/errors";
import { parseFields, sid } from "../../services/query";

export async function listIpAccessControlListsCommand(
  trunkId: string,
  options: { limit?: string; paginationKey?: string; fields?: string } = {},
): Promise<void> {
  try {
    const trunkSid = sid(trunkId, "trunk", "Trunk");
    const fields = parseFields(options.fields, IP_ACL_FIELDS);
    outputJson(
      await listIpAccessControlLists(getTwilioClient(), trunkSid, {
        ...options,
        fields,
      }),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}

async function readLists(trunkSid: string): Promise<IpAccessControlListView[]> {
  const page = await listIpAccessControlLists(getTwilioClient(), trunkSid, {
    limit: "1000",
  });
  return page.items;
}

export async function associateIpAccessControlListCommand(
  trunkId: string,
  options: { ipAccessControlList: string; dryRun?: boolean },
): Promise<void> {
  let trunkSid = "";
  let listSid = "";
  let before: IpAccessControlListView[] = [];
  try {
    trunkSid = sid(trunkId, "trunk", "Trunk");
    listSid = sid(
      options.ipAccessControlList,
      "ipAccessControlList",
      "IP access control list",
    );
    before = await readLists(trunkSid);
    if (options.dryRun) {
      const after = before.some((item) => item.sid === listSid)
        ? before
        : [...before, { sid: listSid, friendly_name: null, addresses: [] }];
      outputJson({ dry_run: true, trunk_sid: trunkSid, before, after });
      return;
    }
  } catch (error) {
    handleTwilioError(error);
  }

  try {
    const client = getTwilioClient();
    if (!before.some((item) => item.sid === listSid)) {
      await client.trunking.v1.trunks(trunkSid).ipAccessControlLists.create({
        ipAccessControlListSid: listSid,
      });
    }
    const after = (
      await listIpAccessControlLists(client, trunkSid, { limit: "1000" })
    ).items;
    if (!after.some((item) => item.sid === listSid)) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The IP access control list read-back does not include the association.",
        false,
        [
          "Read the trunk IP access control lists again before another write.",
          "Do not associate the list again until that read shows it is absent.",
        ],
      );
    }
    outputJson({ dry_run: false, trunk_sid: trunkSid, before, after });
  } catch (error) {
    handleTwilioError(error, { mutating: true });
  }
}

export async function removeIpAccessControlListCommand(
  trunkId: string,
  listId: string,
  options: { dryRun?: boolean } = {},
): Promise<void> {
  let trunkSid = "";
  let listSid = "";
  let before: IpAccessControlListView[] = [];
  try {
    trunkSid = sid(trunkId, "trunk", "Trunk");
    listSid = sid(listId, "ipAccessControlList", "IP access control list");
    before = await readLists(trunkSid);
    if (!before.some((item) => item.sid === listSid)) {
      throw new CliFailure(
        "NOT_FOUND",
        "IP access control list association was not found.",
        false,
        [
          "Read the trunk IP access control lists and use a SID from that read.",
        ],
      );
    }
    if (options.dryRun) {
      outputJson({
        dry_run: true,
        trunk_sid: trunkSid,
        before,
        after: before.filter((item) => item.sid !== listSid),
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
      .ipAccessControlLists(listSid)
      .remove();
    const after = (
      await listIpAccessControlLists(client, trunkSid, { limit: "1000" })
    ).items;
    if (after.some((item) => item.sid === listSid)) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The IP access control list read-back still includes the association.",
        false,
        [
          "Read the trunk IP access control lists again before another write.",
          "Do not remove the list again until that read shows it is still present.",
        ],
      );
    }
    outputJson({ dry_run: false, trunk_sid: trunkSid, before, after });
  } catch (error) {
    handleTwilioError(error, { mutating: true });
  }
}
