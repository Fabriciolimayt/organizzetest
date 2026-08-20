const INSTANCE_NAME = /^[A-Za-z0-9_-]{1,128}$/;

export function validateInstanceName(instanceName, instancePrefix) {
  if (typeof instanceName !== "string" || !INSTANCE_NAME.test(instanceName)) {
    throw new TypeError("instance name is invalid");
  }
  if (typeof instancePrefix !== "string" || !instancePrefix || !instanceName.startsWith(instancePrefix)) {
    throw new TypeError("instance name does not match the configured prefix");
  }
  return instanceName;
}

export function createInstanceRequest({
  baseUrl,
  apiKey,
  instanceName,
  instancePrefix,
  webhookUrl,
  signal,
}) {
  const validatedName = validateInstanceName(instanceName, instancePrefix);
  const body = {
    instanceName: validatedName,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
    webhook: {
      enabled: true,
      url: webhookUrl,
      events: [
        "QRCODE_UPDATED",
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "CONNECTION_UPDATE",
      ],
      base64: true,
    },
  };
  return {
    url: `${baseUrl.replace(/\/$/, "")}/instance/create`,
    options: {
      method: "POST",
      headers: { apikey: apiKey, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    },
  };
}
