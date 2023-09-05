import React from "react";
import EthereumAddress from "@/components/EthereumAddress";
import DecodedData from "@/components/DecodedData";

type AttestationProfileProps = {
  attestationData: {
    attestationUID: string;
    created: string;
    expiration: string;
    revoked: boolean;
    revocable: boolean;
    schemaUID: string;
    from: {
      name: string;
      address: string;
    };
    to: string;
    decodedData: Array<{ type: string; name: string; value: string }>;
    referencedAttestation: string;
    referencingAttestations: number;
  };
};

const Field: React.FC<{ label: string; value: string | React.ReactNode }> = ({
  label,
  value,
}) => {
  return (
    <div className="mb-2">
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );
};

const AttestationProfile: React.FC<AttestationProfileProps> = ({
  attestationData,
}) => {
  return (
    <div className={`flex-grow mx-auto`}>
      <Field label={"Attestation Details"} value="" />
      <div className="bg-white rounded-xl p-4">
        <div className="flex justify-between">
          {/* Header */}
          <div className="mb-4 mt-3 w-3/4 flex-col flex">
            <Field
              label="ATTESTATIONUID"
              value={
                <EthereumAddress address={attestationData.attestationUID} />
              }
            />
            <Field
              label="SCHEMAUID"
              value={<EthereumAddress address={attestationData.schemaUID} />}
            />
          </div>
          <div className="w-2/5  border rounded-xl p-4">
            <Field label="CREATED" value={attestationData.created} />
            <Field label="EXPIRATION" value={attestationData.expiration} />
            <Field
              label="REVOKED"
              value={attestationData.revoked ? "Yes" : "No"}
            />
            <Field
              label="REVOCABLE"
              value={attestationData.revocable ? "Yes" : "No"}
            />
          </div>
        </div>

        <div className="flex justify-between">
          {/* Left Box */}
          <div className="w-3/5 flex flex-col">
            <Field
              label="FROM"
              value={<EthereumAddress address={attestationData.from.address} />}
            />
            <Field
              label="TO"
              value={<EthereumAddress address={attestationData.to} />}
            />
            <Field
              label="Referencing Attestations"
              value={attestationData.referencingAttestations.toString()}
            />
            <Field
              label="Referenced Attestation"
              value={attestationData.referencedAttestation}
            />
          </div>

          {/* Right Box */}
          <div className="w-2/5  border rounded-xl p-4">
            <div className="text-xl font-semibold">Decoded Data</div>
            <DecodedData decodedData={attestationData.decodedData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttestationProfile;
