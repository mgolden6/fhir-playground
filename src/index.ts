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
        console.log(`${name[0].given} ${name[0].family}`);

        ////////////////
        // finding just mobile and email below not working
        ////////////////

        // find the telecom for each patient
        for (let t = 0; t < telecom.length; t++) {
          const contact = telecom[t];
          console.log(contact);

          // only work with patients that can recieve email and SMS
          if ((contact.use = 'mobile' || 'email')) {
            console.log(
              ` - ${contact.use}: ${contact.system}: ${contact.value}`
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
