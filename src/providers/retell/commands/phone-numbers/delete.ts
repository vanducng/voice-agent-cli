/**
 * Phone Numbers Delete Command
 *
 * Releases an existing phone number.
 */

import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";

export async function deletePhoneNumberCommand(
  phoneNumber: string,
): Promise<void> {
  try {
    const client = getRetellClient();
    await client.phoneNumber.delete(phoneNumber);

    outputSuccess({
      message: "Phone number deleted successfully",
      phone_number: phoneNumber,
      operation: "delete",
    });
  } catch (error) {
    handleSdkError(error);
  }
}
