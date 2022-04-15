if (process.env.DEPLOYMENT_ENVIRONMENT === "staging") {
  module.exports = {
    secretOrKey: "Tensorplace",
    TENSORPLACE_PAT: "0e5a0a5c82dc6f52c0c97b07f4aace89c5d1a3c7",
    GITHUB_CLIENT_ID: "5747267b6356157f8938",
    GITHUB_CLIENT_SECRET: "4c374031c021f599b2b1737e9d9e4a8e2d980343",
    bitbucketClientId: "f7zRbMf4r3cn7Zzm7e",
    bitbucketClientSecret: "Eh9TZvhDSmmcMz8VDTEZzbdPc22pzwjg",
    PAYPAL_CLIENT_ID:
      "AcIiZP3zemAO-d8HfcyPN09icJ6CrzAyPIX1wMvbH42cgPo2sw1IbOjBiJelxwosd_gefXmPLGL8KkmA",
    PAYPAL_CLIENT_SECRET:
      "EEoNLuQRQA_SEA4WCI3AWidgnGZlMhDX0bDpQQriJZkMyg5X7QA62d7hfstq9rvUd2eMZmInXx68dn4n",
  };
} else if (process.env.DEPLOYMENT_ENVIRONMENT === "production") {
  module.exports = {
    TENSORPLACE_PAT: "fa5c74577dec36d75c679601694f66a589b934e5",
    secretOrKey: "Tensorplace",
    GITHUB_CLIENT_ID: "0c550d25e82d6929627c",
    GITHUB_CLIENT_SECRET: "afd66dd612055d83f371e90a7699f889525e715f",
    bitbucketClientId: "Ym6MwMPNX4RRzZFh8w",
    bitbucketClientSecret: "LXkbDjWJDCc7dpJVg2xS8hmhRRqgJva9",
    PAYPAL_CLIENT_ID:
      "AcIiZP3zemAO-d8HfcyPN09icJ6CrzAyPIX1wMvbH42cgPo2sw1IbOjBiJelxwosd_gefXmPLGL8KkmA",
    PAYPAL_CLIENT_SECRET:
      "EEoNLuQRQA_SEA4WCI3AWidgnGZlMhDX0bDpQQriJZkMyg5X7QA62d7hfstq9rvUd2eMZmInXx68dn4n",
  };
} else if (process.env.DEPLOYMENT_ENVIRONMENT === "development") {
  module.exports = {
    secretOrKey: "Tensorplace",
    TENSORPLACE_PAT: "0e5a0a5c82dc6f52c0c97b07f4aace89c5d1a3c7",
    GITHUB_CLIENT_ID: "8f4a782ba618eb86d7ec",
    GITHUB_CLIENT_SECRET: "0903c6de0b6d4dad5cea60167e6afdb771f68812",
    bitbucketClientId: "f7zRbMf4r3cn7Zzm7e",
    bitbucketClientSecret: "Eh9TZvhDSmmcMz8VDTEZzbdPc22pzwjg",
    PAYPAL_CLIENT_ID:
      "AcIiZP3zemAO-d8HfcyPN09icJ6CrzAyPIX1wMvbH42cgPo2sw1IbOjBiJelxwosd_gefXmPLGL8KkmA",
    PAYPAL_CLIENT_SECRET:
      "EEoNLuQRQA_SEA4WCI3AWidgnGZlMhDX0bDpQQriJZkMyg5X7QA62d7hfstq9rvUd2eMZmInXx68dn4n",
  };
} else {
  console.log(
    `ERROR: DEPLOYMENT_ENVIRONMENT not proper, should be either "production", "staging" or "development". Currently it's ${process.env.DEPLOYMENT_ENVIRONMENT}`
  );
}
