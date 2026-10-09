import type Twilio from "twilio";
import { emptyToNull, pageQuery, pageResult } from "./query";

export interface CredentialAssociationView {
  sid: string;
  friendly_name: string | null;
}

export interface IpAddressView {
  sid: string;
  ip_address: string;
  cidr_prefix_length: number | null;
  friendly_name: string | null;
}

export interface IpAccessControlListView {
  sid: string;
  friendly_name: string | null;
  addresses: IpAddressView[];
}

export const CREDENTIAL_FIELDS = ["sid", "friendly_name"] as const;
export const IP_ACL_FIELDS = ["sid", "friendly_name", "addresses"] as const;

type NamedSid = { sid: string; friendlyName?: string };
type AddressInstance = NamedSid & {
  ipAddress: string;
  cidrPrefixLength?: number;
};

export async function listCredentialAssociations(
  client: Twilio.Twilio,
  trunkSid: string,
  options: { limit?: string; paginationKey?: string; fields?: string[] },
): Promise<{
  items: CredentialAssociationView[];
  has_more: boolean;
  pagination_key?: string;
}> {
  const page = await client.trunking.v1
    .trunks(trunkSid)
    .credentialsLists.page(pageQuery(options));
  return pageResult(
    page.instances.map((item: NamedSid) => ({
      sid: item.sid,
      friendly_name: emptyToNull(item.friendlyName),
    })),
    page.nextPageUrl,
    options.fields,
  );
}

export async function listIpAccessControlLists(
  client: Twilio.Twilio,
  trunkSid: string,
  options: { limit?: string; paginationKey?: string; fields?: string[] },
): Promise<{
  items: IpAccessControlListView[];
  has_more: boolean;
  pagination_key?: string;
}> {
  const page = await client.trunking.v1
    .trunks(trunkSid)
    .ipAccessControlLists.page(pageQuery(options));
  const items = await Promise.all(
    page.instances.map(async (item: NamedSid) => {
      const addresses = await client.sip
        .ipAccessControlLists(item.sid)
        .ipAddresses.list({ limit: 1000 });
      return {
        sid: item.sid,
        friendly_name: emptyToNull(item.friendlyName),
        addresses: addresses.map((address: AddressInstance) => ({
          sid: address.sid,
          ip_address: address.ipAddress,
          cidr_prefix_length: address.cidrPrefixLength ?? null,
          friendly_name: emptyToNull(address.friendlyName),
        })),
      };
    }),
  );
  return pageResult(items, page.nextPageUrl, options.fields);
}
