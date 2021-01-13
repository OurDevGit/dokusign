const docusign = require('docusign-esign');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const upload = async (req, res, next) => {
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let docs = [];

            //loop all files
            if (!(req.files.docs instanceof Array)) {
                req.files.docs = [req.files.docs];
            }

            _.forEach(_.keysIn(req.files.docs), (key) => {
                let doc = req.files.docs[key];

                //move doc to uploads directory
                doc.mv('./uploads/' + doc.name);

                //push file details
                docs.push({
                    name: doc.name,
                    mimetype: doc.mimetype,
                    size: doc.size
                });
            });

            const args = {
                signerEmail: req.body.renterEmail,
                signerName: req.body.renterName,
                requestSign: req.body.requestSign
            };

            const {envelopeId} = await worker(docs, {
                basePath: 'https://demo.docusign.net/restapi',
                accessToken: req.body.renterAccessToken,
                envelopeArgs: args,
                accountId: '1863b5b0-8822-48e5-a43e-b8642a81cbad'
            })

            //return response
            res.send({
                status: true,
                message: 'Docusign email was sent!',
                data: {envelopeId}
            });
        }
    } catch (err) {
        // console.error(err)
        res.status(500).send(err);
    }
}

const makeEnvelope = (docs, args) => {
    return new Promise((resolve, reject) => {
        // Create the envelope definition
        let env = new docusign.EnvelopeDefinition();
        env.emailSubject = 'Please sign this document set';

        const docPromises = docs.map((doc, index) => {
            return new Promise((resolve, reject) => {
                fs.readFile(path.resolve('./uploads', doc.name), (err, data) => {
                    if (err) reject(err);
                    else {
                        fs.unlinkSync(path.resolve('./uploads', doc.name));
                        resolve({
                            name: doc.name,
                            content: data
                        });
                    }
                });
            })
        });

        Promise.all(docPromises).then(docContents => {
            const docusignDocuments = docContents.map((doc, index) => {
                const docBase64 = Buffer.from(doc.content).toString('base64');

                const documentId = index + 1;

                return new docusign.Document.constructFromObject({
                    documentBase64: docBase64,
                    name: doc.name,
                    fileExtension: 'pdf',
                    documentId: documentId.toString()
                });
            });

            // The order in the docs array determines the order in the envelope
            env.documents = docusignDocuments;

            // create a signer recipient to sign the document, identified by name and email
            // We're setting the parameters via the object constructor
            let signer1 = docusign.Signer.constructFromObject({
                email: args.signerEmail,
                name: args.signerName,
                recipientId: '1',
                routingOrder: '1'
            });

            if (args.requestSign) {
                // routingOrder (lower means earlier) determines the order of deliveries
                // to the recipients. Parallel routing order is supported by using the
                // same integer as the order for two or more recipients.

                // Create signHere fields (also known as tabs) on the documents,
                // We're using anchor (autoPlace) positioning
                //
                // The DocuSign platform searches throughout your envelope's
                // documents for matching anchor strings. So the
                // signHere2 tab will be used in both document 2 and 3 since they
                // use the same anchor string for their "signer 1" tabs.
                let signHere1 = docusign.SignHere.constructFromObject({
                    anchorString: '**signature_1**',
                    anchorYOffset: '10', anchorUnits: 'pixels',
                    anchorXOffset: '20'
                })
                    , signHere2 = docusign.SignHere.constructFromObject({
                        anchorString: '/sn1/',
                        anchorYOffset: '10', anchorUnits: 'pixels',
                        anchorXOffset: '20'
                    })
                    ;

                // Tabs are set per recipient / signer
                let signer1Tabs = docusign.Tabs.constructFromObject({
                    signHereTabs: [signHere1, signHere2]
                });
                signer1.tabs = signer1Tabs;
            }

            // Add the recipients to the envelope object
            let recipients = docusign.Recipients.constructFromObject({
                signers: [signer1],
                carbonCopies: []
            });
            env.recipients = recipients;

            // Request that the envelope be sent by setting |status| to "sent".
            // To request that the envelope be created as a draft, set to "created"
            env.status = 'sent';

            resolve(env);
        });
    });
}

const worker = async (docs, args) => {
    // Data for this method
    // args.basePath
    // args.accessToken
    // args.accountId

    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(args.basePath);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + args.accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient)
        , results = null;

    // - Make the envelope request body
    let envelope = await makeEnvelope(docs, args.envelopeArgs)

    // - call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = await envelopesApi.createEnvelope(args.accountId,
        {envelopeDefinition: envelope});
    let envelopeId = results.envelopeId;

    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    return ({envelopeId: envelopeId})
}

module.exports = {
    upload
};