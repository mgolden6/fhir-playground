const express = require('express');
const mkFhir = require(`fhir.js`);

const app = express();

app.use(express.json());

const baseUrl: string =
  //! this is not working for hapi.fhir
  // 'http://hapi.fhir.org/baseR4';
  // 'http://hapi.fhir.org/baseR5';
  'https://server.fire.ly';

const client = mkFhir({
  baseUrl,
});

// get a bundle of MedicationRequessts
const getMedicationRequest = async (patientId: number) => {
  try {
    const medicationRequest = await client.search({
      type: 'MedicationRequest',
    });

    // read each MedicationRequest entry (if any)
    if (medicationRequest && medicationRequest.data.entry.length > 0) {
      for (let e = 0; e < medicationRequest.data.entry.length; e++) {
        const entry = medicationRequest.data.entry[e];

        // find the subject (patient) associated with the MedicationRequest
        const { reference: patientReference } = entry.resource.subject;
        const patientReferenceId: string =
          getPatientReferenceId(patientReference);

        // find the Patient resource by id
        const patient = await client.search({
          type: `Patient/${patientReferenceId}`,
        });

        // pull required patient elements
        const { id, name, telecom } = patient.data;
        if (telecom) {
        }

        // only consider patients that have an ID & name & telecom
        if (id && name && telecom) {
          // get each telecom
          for (let t = 0; t < telecom.length; t++) {
            const contact = telecom[t];
            // only consider patients with telecom.use === "mobile"
            // or telecom.system === "email"
            if (
              (contact.use && contact.use === 'mobile') ||
              (contact.use && contact.system === 'email')
            ) {
              // output only those patients with email or mobile phone
              // would be better if only printed name once
              console.log(
                `${name[0].given} ${name[0].family}: ${contact.use} ${contact.system}: ${contact.value}`
              );
            } else {
              // should throw error and res.status, etc. if not meet criteria above

              console.log(
                `${name[0].given} ${name[0].family}: need email or mobile phone`
              );
            }
          }
        }

        // parse the MedicationReferenceId from it's URL
        if (entry.resource.medicationReference) {
          const medicationReferenceId: string = getMedicationReferenceId(
            entry.resource.medicationReference.reference
          );

          // find the medication resource by id
          const medication = await client.search({
            type: `Medication/${medicationReferenceId}`,
          });

          // find the coding system, code & display)
          //? more than rxnorm and snomed?
          let system: string;
          const { coding } = medication.data.code;
          coding[0].system.includes('rxnorm')
            ? (system = 'rxnorm')
            : (system = 'snomed');
          console.log(`${system}: ${coding[0].code} = ${coding[0].display}`);
        }
      }
    }
  } catch (error) {
    console.log(`error: ${error}`);
  }
};

const getPatientReferenceId = (referenceUrl: string) => {
  let prId = referenceUrl.replace(`${baseUrl}/Patient/`, '');
  return prId;
};

const getMedicationReferenceId = (referenceUrl: string) => {
  let mrId = referenceUrl.replace(`${baseUrl}/Medication/`, '');
  return mrId;
};

getMedicationRequest(123456);

app.listen(3000, () => {
  console.log(`express server listening on port 3000`);
});
