import React, { useEffect, useState } from "react";
import { Card, Input, Progress, Typography } from "@material-tailwind/react";
import TagSelect from "@/components/TagSelect";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import {
  validateInput,
  transformFormData,
  decodeBase64ToHex,
  encodeHexToBase64,
} from "@/lib/utils";
import {
  useContractWrite,
  usePrepareContractWrite,
  useChainId,
  useWaitForTransaction,
} from "wagmi";
import { CONTRACTS } from "@/constants/contracts";
import Notification from "./Notification";
import AttestOffChain from "./AttestOffChain";
import AttestByDelegate from "./AttestByDelegate";

import FileUploadForm from "./FileUploadForm";
type DynamicFormModalProps = {
  schema: string;
  schemaUID?: string;
  isSubscription: boolean;
  isOpen: boolean;
  resolver?: string;
  onClose: () => void;
};

const DynamicForm: React.FC<DynamicFormModalProps> = ({
  schema,
  schemaUID,
  isSubscription,
  isOpen,
  resolver,
  onClose,
}) => {
  const chainID = useChainId();
  const encoder = new SchemaEncoder(schema);
  const schemaArray = schema.split(",").map((item) => {
    const [type, name] = item.trim().split(" ");
    return { type, name };
  });

  const [formData, setFormData] = useState({});
  const [data, setData] = useState("");
  const [base64Data, setBase64Data] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const [open, setOpen] = useState(isOpen);
  const [isRevocable, setIsRevocable] = useState(false);
  const [isOffChain, setIsOffChain] = useState(false);

  const [recipient, setRecipient] = useState(
    "0x0000000000000000000000000000000000000000"
  );
  const [referencedAttestation, setReferencedAttestation] = useState(
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  );
  const { config, error } = usePrepareContractWrite({
    // @ts-ignore
    address: CONTRACTS.TAS[chainID].contract,
    // @ts-ignore
    abi: CONTRACTS.TAS[chainID].abi,
    functionName: "attest",
    args: [
      [
        schemaUID,
        [recipient, 0, isRevocable, referencedAttestation, data, base64Data, 0],
      ],
    ],
    value: BigInt(0),
  });
  const {
    write,
    data: txdata,
    isError,
    isLoading,
    isSuccess,
  } = useContractWrite(config);

  const {
    data: res,
    isError: err,
    isLoading: wait,
    isSuccess: succ,
  } = useWaitForTransaction({
    confirmations: 2,

    hash: txdata?.hash,
  });

  useEffect(() => {
    try {
      prepareData();
    } catch {
      // Handle errors
    }
  }, [data]);

  useEffect(() => {
    try {
      prepareData();
    } catch {
      // Handle errors
    }
  }, [formData]);

  useEffect(() => {
    try {
      prepareData();
    } catch {
      // Handle errors
    }
  }, [isOffChain]);
  const handleInputChange = (
    newValue: any,
    attributeName: any,
    attributeType: any
  ) => {
    let newFormData = (prevData: any) => {
      // Create a copy of the existing formData
      const updatedFormData = { ...prevData };

      // Update the specific attribute based on its type
      if (
        attributeType.endsWith("[]") ||
        attributeName == "jsonCIDs" ||
        attributeName == "videoCIDs" ||
        attributeName == "imageCIDs"
      ) {
        // For array attributes, update the attribute directly within the array
        console.log(newValue);
        updatedFormData[attributeName] = newValue;
      } else {
        if (
          attributeName == "jsonCID" ||
          attributeName == "videoCID" ||
          attributeName == "imageCID"
        ) {
          updatedFormData[attributeName] = newValue;
        } else {
          // For non-array attributes, update as before
          updatedFormData[attributeName] = newValue.target.value;
        }
      }

      return updatedFormData;
    };
    // Use the functional form of setFormData to ensure the latest state
    setFormData(newFormData);
    try {
      prepareData();
    } catch {}
  };

  const prepareData = () => {
    const errors = {};
    let empty = false;
    for (const attribute of schemaArray) {
      // @ts-ignore
      const error = validateInput(formData[attribute.name], attribute.type);
      console.log(error, formData);
      if (error) {
        // @ts-ignore
        errors[attribute.name] = error;
      }
      // @ts-ignore
      if (!formData[attribute.name]) {
        empty = true;
      }
    }

    console.log("Form data:", formData, data); // Move the logging here
    let encodedData = encoder.encodeData(transformFormData(formData, schema));
    console.log(formData, "  ", encodedData);
    let b64 = encodeHexToBase64(encodedData);
    setData(encodedData);
    setBase64Data(b64);
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 overflow-y-auto ${
        open ? "block" : "hidden"
      }`}
    >
      <Card
        color="white"
        shadow={false}
        className="mb-4 p-4 border border-black rounded-xl"
      >
        <Typography color="gray" className="mt-1 font-normal">
          Enter your details to attest.
        </Typography>
        <form className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
          <div className="mb-4 flex flex-col gap-6">
            {schemaArray.map((attribute, index) => (
              <div key={index}>
                {/*  @ts-ignore */}
                {formErrors[attribute.name] && (
                  <Typography color="red" className="mt-1">
                    {/*  @ts-ignore */}
                    {formErrors[attribute.name]}
                  </Typography>
                )}
                {attribute.type.endsWith("[]") &&
                !(
                  attribute.name == "jsonCIDs" ||
                  attribute.name == "imageCIDs" ||
                  attribute.name == "videoCIDs"
                ) ? (
                  <TagSelect
                    name={attribute.name}
                    onChange={(tags: any) => {
                      // Handle array inputs directly with an array of tags
                      handleInputChange(tags, attribute.name, attribute.type);
                    }}
                    // @ts-ignore
                    placeholder={`Enter ${attribute.name} tags`}
                    // @ts-ignore
                    tags={formData[attribute.name] || []}
                    setTags={(tags: any) => {
                      // Update tags directly with the array
                      setFormData((prevData) => ({
                        ...prevData,
                        [attribute.name]: tags,
                      }));
                    }}
                    formErrors={formErrors}
                    setFormErrors={setFormErrors}
                    attributeType={attribute.type}
                  />
                ) : attribute.name == "jsonCID" ||
                  attribute.name == "imageCID" ||
                  attribute.name == "videoCID" ||
                  attribute.name == "jsonCIDs" ||
                  attribute.name == "imageCIDs" ||
                  attribute.name == "videoCIDs" ? (
                  <FileUploadForm
                    isSubscription={isSubscription}
                    resolver={resolver}
                    chainID={chainID}
                    // @ts-ignore
                    schemaUID={schemaUID}
                    type={attribute.name}
                    handleInputChange={(newValue, attrName, attrType) => {
                      handleInputChange(newValue, attrName, attrType);
                      try {
                        prepareData();
                      } catch {}
                    }}
                  />
                ) : (
                  <div className="flex flex-col">
                    <label htmlFor={attribute.name} className="mb-1">
                      {attribute.name}
                    </label>
                    <Input
                      size="lg"
                      placeholder={`${attribute.name} (${attribute.type})`}
                      name={attribute.name}
                      // @ts-ignore
                      value={formData[attribute.name] || ""}
                      onChange={(e) =>
                        handleInputChange(e, attribute.name, attribute.type)
                      }
                      /*  @ts-ignore */
                      error={formErrors[attribute.name]}
                    />
                  </div>
                )}
              </div>
            ))}
            <div className="flex flex-col">
              <label className="mb-1">
                {"Attestation Recipient (Optional-address)"}
              </label>
              <Input
                size="lg"
                placeholder={`${"recipient"} (${"address"})`}
                name={"recipient"}
                value={recipient || ""}
                onChange={(e) => setRecipient(e.target.value)}
                //  @ts-ignore
                error={formErrors["recipient"]}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1">
                {"Reference Attestation (Optional-bytes32)"}
              </label>
              <Input
                size="lg"
                placeholder={`${"ReferencedAttestation"} (${"bytes32"})`}
                name={"ReferencedAttestation"}
                value={referencedAttestation || ""}
                onChange={(e) => setReferencedAttestation(e.target.value)}
                // @ts-ignore
                error={formErrors["ReferencedAttestation"]}
              />
            </div>
            <div className="flex  justify-center items-center gap-2 ">
              {" "}
              <input
                type="checkbox"
                checked={isRevocable}
                onChange={() => setIsRevocable(!isRevocable)}
                className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2  mb-3 cursor-pointer "
              />
              <Typography
                className="cursor-pointer focus:ring-blue-500 focus:ring-2  mb-3"
                color="black"
                onClick={() => setIsRevocable(!isRevocable)}
              >
                Revocable
              </Typography>
              <input
                type="checkbox"
                checked={isOffChain}
                onChange={() => setIsOffChain(!isOffChain)}
                className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2  mb-3 cursor-pointer "
              />
              <Typography
                className="cursor-pointer focus:ring-blue-500 focus:ring-2  mb-3"
                color="black"
                onClick={() => setIsOffChain(!isOffChain)}
              >
                offChain
              </Typography>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {!isOffChain ? (
              <button
                type="button"
                onClick={() => {
                  try {
                    // @ts-ignore
                    write();
                  } catch {}
                  onClose;
                }}
                className="bg-black text-white rounded-md px-6 py-2 hover:bg-white hover:text-black border border-black"
              >
                Attest
              </button>
            ) : (
              <AttestOffChain
                version={"1"}
                schema={schemaUID as `0x${string}`}
                recipient={recipient as `0x${string}`}
                time={0}
                expirationTime={0}
                revocable={isRevocable}
                refUID={referencedAttestation as `0x${string}`}
                AttestationData={data as `0x${string}`}
                AttestationBase64={base64Data}
              />
            )}
            <button
              type="button"
              className="bg-black text-white rounded-md px-6 py-2 hover:bg-white hover:text-black border border-black"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
      <Notification
        isLoading={isLoading}
        isSuccess={isSuccess}
        isError={error ? true : false}
        wait={wait}
        error={err}
        success={succ}
      />
    </div>
  );
};

export default DynamicForm;
