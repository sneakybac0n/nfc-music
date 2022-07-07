const { NFC } = require('nfc-pcsc');
const nfcCard = require('nfccard-tool');

const process_sonos_command = require('./process_sonos_command');

const nfc = new NFC(); // optionally you can pass logger

nfc.on('reader', reader => {

	console.log(`${reader.reader.name}  device attached`);

	// enable when you want to auto-process ISO 14443-4 tags (standard=TAG_ISO_14443_4)
	// when an ISO 14443-4 is detected, SELECT FILE command with the AID is issued
	// the response is available as card.data in the card event
	// see examples/basic.js line 17 for more info
	// reader.aid = 'F222222222';

	reader.on('card', async card => {

		// card is object containing following data
		// [always] String type: TAG_ISO_14443_3 (standard nfc tags like MIFARE) or TAG_ISO_14443_4 (Android HCE and others)
		// [always] String standard: same as type
		// [only TAG_ISO_14443_3] String uid: tag uid
		// [only TAG_ISO_14443_4] Buffer data: raw data from select APDU response

		console.log(`${reader.reader.name}  card detected`, card);

        try {
            /**
             *  1 - READ HEADER
             *  Read from block 0 to block 4 (20 bytes length) in order to parse tag information
             *  Block 4 is the first data block -- should have the TLV info
             */
            const cardHeader = await reader.read(0, 20);
    
            const tag = nfcCard.parseInfo(cardHeader);
            // console.log('tag info:', JSON.stringify(tag))
    
            /**
             *  2 - Read the NDEF message and parse it if it's supposed there is one
             *  The NDEF message must begin in block 4 -- no locked bits, etc.
             *  Make sure cards are initialized before writing.
             */
    
            if (
              nfcCard.isFormatedAsNDEF() &&
              nfcCard.hasReadPermissions() &&
              nfcCard.hasNDEFMessage()
            ) {
              // Read the appropriate length to get the NDEF message as buffer
              const NDEFRawMessage = await reader.read(
                4,
                nfcCard.getNDEFMessageLengthToRead()
              ); // starts reading in block 0 until end
    
              // Parse the buffer as a NDEF raw message
              const NDEFMessage = nfcCard.parseNDEF(NDEFRawMessage);
    
              // console.log('NDEFMessage:', NDEFMessage)
    
              for (const record of NDEFMessage) {
                let service_type, sonos_instruction;
                switch (record.type) {
                  case 'uri':
                    record.text = record.uri;
                  case 'text':
                    const received_text = record.text;
                    console.log('Read from NFC tag with message: ', received_text);
    
                    await process_sonos_command(received_text);
                }
              }
            } else {
              console.log(
                'Could not parse anything from this tag: \n The tag is either empty, locked, has a wrong NDEF format or is unreadable.'
              );
            }
          } catch (err) {
            console.error(err.toString());
          }
	});

	reader.on('card.off', card => {
		console.log(`${reader.reader.name}  card removed`, card);
	});

	reader.on('error', err => {
		console.log(`${reader.reader.name}  an error occurred`, err);
	});

	reader.on('end', () => {
		console.log(`${reader.reader.name}  device removed`);
	});

});

nfc.on('error', err => {
	console.log('an error occurred', err);
});