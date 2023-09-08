import React, { useState, useEffect } from "react";
import { Typography, Button } from "@material-tailwind/react";
import { Navbar } from "@/components/layout";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading/Loading";
import Link from "next/link"; // Import Link from Next.js
import SchemaProfile from "@/components/SchemaProfile";
import { useRouter } from "next/router";
import { getSchemaAttestations, getSchema } from "@/lib/tableland";
import TimeCreated from "@/components/TimeCreated"; // Replace with the actual path
import EthereumAddress from "@/components/EthereumAddress";

const schema = () => {
  const [taken, setTaken] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [schemaData, setSchemaData] = useState({
    schemaUID: "",
    name: "",
    description: "",
    created: "17 hours ago",
    creator: "",
    resolverContract: "",
    revocable: true,
    attestationCount: {
      onchain: 1,
      offchain: 0,
    },
    decodedSchema: [],
    rawSchema: "",
  });

  const router = useRouter();
  const schemaUID = router?.query?.schemaUID;

  function decodeSchema(rawSchema: string) {
    if (typeof rawSchema !== "string") {
      // Handle the case where rawSchema is not a string (e.g., it's undefined or null)
      return [];
    }

    // Continue with your existing code to split and decode the schema
    const fieldStrings = rawSchema.split(",").map((field) => field.trim());
    const decodedSchema = [];
    fieldStrings.forEach((fieldString) => {
      const [type, name] = fieldString.split(" ");
      decodedSchema.push({ type, name });
    });
    console.log(decodedSchema);

    return decodedSchema;
  }

  useEffect(() => {
    async function fetch() {
      if (schemaUID) {
        const attestationTableInfo = [];
        let attestations = await getSchemaAttestations(schemaUID);
        let schema = await getSchema(schemaUID);
        schema = schema[0];
        let schemaInfo = schemaData;
        attestations.forEach((inputObject, index) => {
          // Create a tableData entry
          const entry = {
            uid: inputObject.uid,
            fromAddress: inputObject.attester,
            toAddress: inputObject.recipient,

            age: inputObject.creationTimestamp,
            // Add other properties as needed from the inputObject
          };

          // Push the entry to the tableData array
          attestationTableInfo.push(entry);
        });
        schemaInfo.creator = schema.creator;
        // @ts-ignore
        schemaInfo.decodedSchema = decodeSchema(schema.schema);
        // @ts-ignore

        schemaInfo.schemaUID = schemaUID;
        schemaInfo.name = schema.name;
        schemaInfo.description = schema.description;
        schemaInfo.resolverContract = schema.resolver;
        schemaInfo.rawSchema = schema.schema;
        schemaInfo.revocable = schema.revocable === "true" ? true : false;
        schemaInfo.created = schema.creationTimestamp;
        setTaken(!taken);

        setTableData(attestationTableInfo);
        setSchemaData(schemaInfo);
        console.log(schemaData);
      }
    }
    if (!taken && schemaUID) {
      fetch();
    }
  }, [schemaUID]);

  return (
    <div className={`flex flex-col min-h-screen bg-blue-gray-100`}>
      <Navbar />
      {taken ? (
        <>
          <SchemaProfile schemaData={schemaData}></SchemaProfile>
          {tableData.length > 0 ? (<div className="mt-10 mx-[25%]">
            <div className="overflow-x-auto rounded-lg">
              <table className="w-screen-md table-fixed border-b border-gray">
                <thead className="bg-black">
                  <tr>
                    <th className="w-4/12 py-2 text-white border-r border-gray">
                      attestationUID
                    </th>
                    <th className="w-3/12 py-2 text-white border-r border-gray">
                      From Address
                    </th>
                    <th className="w-3/12 py-2 text-white border-r border-gray">
                      To Address
                    </th>
                    <th className="w-2/12 py-2 text-white">createdAt</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-gray-100" : "bg-white"
                      } text-center`}
                    >
                      <td className="py-2 border-r border-gray border-b border-gray">
                        <div className="flex items-center justify-center">
                          <EthereumAddress
                            link={`/attestation?uid=${row.uid}`}
                            address={row.uid}
                          />
                        </div>
                      </td>
                      <td className="py-2 border-r border-gray border-b border-gray">
                        <div className="flex items-center justify-center">
                          <EthereumAddress address={row.fromAddress} />
                        </div>
                      </td>
                      <td className="py-2 border-r border-gray border-b border-gray">
                        <div className="flex items-center justify-center">
                          <EthereumAddress address={row.toAddress} />
                        </div>
                      </td>
                      <td className="py-2 border-b border-gray">
                        <div className="flex items-center justify-center">
                          <p className="px-2 py-2">
                            {<TimeCreated createdAt={row.age} />}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>): (
            <div>
              <Typography className="mt-5 text-center"variant="h5">No attestations</Typography>
            </div>
          )}
        </>
      ) : (
        <Loading />
      )}
      <div className="flex-grow"></div>

      <Footer />
    </div>
  );
};

export default schema;
