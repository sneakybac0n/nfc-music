const { NFC, TAG_ISO_14443_3, TAG_ISO_14443_4, KEY_TYPE_A, KEY_TYPE_B } = require('nfc-pcsc');
const nfcCard = require('nfccard-tool');
const fs = require('fs');
// import { NFC } from 'nfc-pcsc';
// import { nfcCard } from 'nfccard-tool';
// import process_sonos_com

var { sonos_room, sonos_http_api, reset_repeat, reset_shuffle, reset_crossfade } = JSON.parse(
  fs.readFileSync('usersettings.json', 'utf-8')
);

const get_sonos_url = (sonos_instruction, service_type) => {
  if (service_type == 'completeurl') {
    return sonos_instruction;
  }

  return sonos_http_api + '/' + sonos_room + '/' + sonos_instruction;
};

async function process_sonos_command(received_text) {
  let service_type, sonos_instruction;
  let received_text_lower = received_text.toLowerCase();

  if (received_text_lower.startsWith('apple:')) {
    service_type = 'applemusic';
    sonos_instruction = 'applemusic/now/' + received_text.slice(6);
  } else if (received_text_lower.startsWith('applemusic:')) {
    service_type = 'applemusic';
    sonos_instruction = 'applemusic/now/' + received_text.slice(11);
  } else if (received_text_lower.startsWith('bbcsounds:')) {
    service_type = 'bbcsounds';
    sonos_instruction = 'bbcsounds/play/' + received_text.slice(10);
  } else if (received_text_lower.startsWith('http')) {
    service_type = 'completeurl';
    sonos_instruction = received_text;
  } else if (received_text_lower.startsWith('spotify:')) {
    service_type = 'spotify';
    sonos_instruction = 'spotify/now/' + received_text;
  } else if (received_text_lower.startsWith('tunein:')) {
    service_type = 'tunein';
    sonos_instruction = 'tunein/play/' + received_text.slice(7);
  } else if (received_text_lower.startsWith('favorite:')) {
    service_type = 'favorite';
    sonos_instruction = 'favorite/' + received_text.slice(9);
  } else if (received_text_lower.startsWith('amazonmusic:')) {
    service_type = 'amazonmusic';
    sonos_instruction = 'amazonmusic/now/' + received_text.slice(12);
  } else if (received_text_lower.startsWith('playlist:')) {
    service_type = 'sonos_playlist';
    sonos_instruction = 'playlist/' + received_text.slice(9);
  } else if (received_text_lower.startsWith('command:')) {
    service_type = 'command';
    sonos_instruction = received_text.slice(8);
  } else if (received_text_lower.startsWith('room:')) {
    sonos_room = received_text.slice(5);
    console.log(`Sonos room changed to ${sonos_room}`);
    return;
  }

  if (!service_type) {
    console.log(
      'Service type not recognised. Text should begin ' +
        "'spotify', 'tunein', 'favorite', 'amazonmusic', 'apple'/'applemusic', 'bbcsounds', 'command', 'http', 'playlist', or 'room'."
    );
    return;
  }

  console.log("Detected '%s' service request", service_type);
  if (service_type != 'command') {
    let res;
    if (reset_repeat) {
        console.log('Resetting repeat');
        res = await fetch(get_sonos_url('repeat/off'));
        if (!res.ok)
        throw new Error(
            `Unexpected response while turning repeat off: ${res.status}`
        );
    } else {
        console.log('Skipping resetting repeat');
    }   
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    if (reset_shuffle) {
        console.log('Resetting shuffle');
        res = await fetch(get_sonos_url('shuffle/off'));
        if (!res.ok)
        throw new Error(
            `Unexpected response while turning shuffle off: ${res.status}`
        );
    } else {
        console.log('Skipping resetting shuffle');
    }
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (reset_crossfade) {
        console.log('Resetting crossfade');
        res = await fetch(get_sonos_url('crossfade/off'));
        if (!res.ok)
        throw new Error(
            `Unexpected response while turning crossfade off: ${res.status}`
        );
    } else {
        console.log('Skipping resetting scrossfade');
    }
    await new Promise((resolve) => setTimeout(resolve, 200));

    res = await fetch(get_sonos_url('clearqueue'));
    console.log('Clearing Sonos queue');
    if (!res.ok)
      throw new Error(
        `Unexpected response while clearing queue: ${res.status}`
      );
  }

  const urltoget = get_sonos_url(sonos_instruction, service_type);

  // Perform the requested action on the sonos API
  console.log('Fetching URL via HTTP api: %s', urltoget);
  const res = await fetch(urltoget);

  if (!res.ok) {
    throw new Error(
      `Unexpected response while sending instruction: ${res.status}`
    );
  }

  console.log('Sonos API reports: ', await res.json());

  // Wait a bit before processing next record so the API has time to respond to first command
  // e.g. want to seek on a new queue -- need the new queue to exist. Is there a way to check/confirm
  // with Sonos that a prior command is complete? I'm not sure if this a sonos thing or the http API
  // sometimes throwing commands into the ether while Sonos is busy.
  await new Promise((resolve) => setTimeout(resolve, 200));
}

const nfc = new NFC(); // optionally you can pass logger

nfc.on('reader', reader => {

    
	console.log(`${reader.reader.name}  device attached`);

	// enable when you want to auto-process ISO 14443-4 tags (standard=TAG_ISO_14443_4)
	// when an ISO 14443-4 is detected, SELECT FILE command with the AID is issued
	// the response is available as card.data in the card event
	// see examples/basic.js line 17 for more info
	reader.aid = 'F222222222';

	reader.on('card', async card => {
        // Don't forget to fill YOUR keys and types! (default ones are stated below)
        
        // const key = 'FFFFFFFFFFFF'; // key must be a 12-chars HEX string, an instance of Buffer, or array of bytes
        // const keyType = KEY_TYPE_A;
        // try {

        //     // we want to authenticate sector 1
        //     // authenticating one block within the sector will authenticate all blocks within that sector
        //     // so in our case, we choose block 4 that is within the sector 1, all blocks (4, 5, 6, 7)
        //     // will be authenticated with the given key
        //     await reader.authenticate(4, keyType, key);

        //     // Note: writing might require to authenticate with a different key (based on the sector access conditions)

        //     console.log(`sector 1 successfully authenticated`, reader);

        // } catch (err) {
        //     console.log(`error when authenticating block 4 within the sector 1`, reader, err);
        //     return;
        // }


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
            // const cardHeader = await reader.read(4, 16, 16); 
            // console.log('cardHeader info:', cardHeader)
    
            // const tag = nfcCard.parseInfo(cardHeader);
            // console.log('tag info:', JSON.stringify(tag))
    
            /**
             *  2 - Read the NDEF message and parse it if it's supposed there is one
             *  The NDEF message must begin in block 4 -- no locked bits, etc.
             *  Make sure cards are initialized before writing.
             */
    
            // if (
            //   nfcCard.isFormatedAsNDEF() &&
            //   nfcCard.hasReadPermissions() &&
            //   nfcCard.hasNDEFMessage()
            // ) {
            // Read the appropriate length to get the NDEF message as buffer
            const NDEFRawMessage = await reader.read(
                4,
                16, 
                16
            ); // starts reading in block 0 until end
            console.log('NDEFRawMessage:', NDEFRawMessage)
            // Parse the buffer as a NDEF raw message

            const payload = NDEFRawMessage.readInt32BE(0);
            console.log('payload:', payload)

            const NDEFMessage = nfcCard.parseNDEF(NDEFRawMessage);

            console.log('NDEFMessage:', NDEFMessage)

            for (const record of NDEFMessage) {
            let service_type, sonos_instruction;
            switch (record.type) {
                case 'uri':
                record.text = record.uri;
                case 'text':
                const received_text = record.text;
                console.log('Read from NFC tag with message: ', received_text);

                process_sonos_command(received_text);
            }
            }
            // } else {
            //   console.log(
            //     'Could not parse anything from this tag: \n The tag is either empty, locked, has a wrong NDEF format or is unreadable.'
            //   );
            // }
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