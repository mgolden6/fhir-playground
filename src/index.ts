const express = require('express');
const mkFhir = require(`fhir.js`);

const app = express();

app.use(express.json());

const client = mkFhir({
  // baseUrl: 'http://hapi.fhir.org/baseR4',
  // baseUrl: 'http://hapi.fhir.org/baseR5',
  baseUrl: 'http://server.fire.ly',
});

try {
  // get a bundle of patients
  client.search({ type: 'Patient' }).then(function (res) {
    var bundle = res.data;
    // log the size of the bundle
    var count = (bundle.entry && bundle.entry.length) || 0;
    console.log(`number of patients: ${count}`);

    // look through each bundle entry
    for (let e = 0; e < bundle.entry.length; e++) {
      const bundleEntry = bundle.entry[e];

      // pull the fields we need from each entry
      const { id, name, telecom } = bundleEntry.resource;

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
    }
  });
} catch (error) {
  if (error.status) {
    console.log(`error: ${error.status}`);
  }
  if (error.message) {
    console.log(`error: ${error.message}`);
  }
}

app.listen(3000, () => {
  console.log(`express server listening on port 3000`);
});
