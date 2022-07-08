const fs = require('fs');

var { sonos_room, sonos_http_api, reset_repeat, reset_shuffle, reset_crossfade } = JSON.parse(
  fs.readFileSync('usersettings.json', 'utf-8')
);

const get_sonos_url = (sonos_instruction, service_type) => {
  if (service_type == 'completeurl') {
    return sonos_instruction;
  }

  return sonos_http_api + '/' + sonos_room + '/' + sonos_instruction;
};

module.exports = async function process_sonos_command(received_text = '') {
  let service_type, sonos_instruction;
  let received_text_split = received_text.split('|');
  
  let command_text = received_text_split[0];
  console.log(`${command_text}`);

  let shuffle = received_text_split?.[1]?.includes('shuffle') || false;
  let keep_queue = received_text_split?.[1]?.includes('keep_queue') || false; 

  if (command_text.startsWith('apple:')) {
    service_type = 'applemusic';
    sonos_instruction = 'applemusic/now/' + command_text.slice(6);
  } else if (command_text.startsWith('applemusic:')) {
    service_type = 'applemusic';
    sonos_instruction = 'applemusic/now/' + command_text.slice(11);
  } else if (command_text.startsWith('bbcsounds:')) {
    service_type = 'bbcsounds';
    sonos_instruction = 'bbcsounds/play/' + command_text.slice(10);
  } else if (command_text.startsWith('http')) {
    service_type = 'completeurl';
    sonos_instruction = command_text;
  } else if (command_text.startsWith('spotify:')) {
    service_type = 'spotify';
    sonos_instruction = 'spotify/now/' + command_text;
  } else if (command_text.startsWith('tunein:')) {
    service_type = 'tunein';
    sonos_instruction = 'tunein/play/' + command_text.slice(7);
  } else if (command_text.startsWith('favorite:')) {
    service_type = 'favorite';
    sonos_instruction = 'favorite/' + command_text.slice(9);
  } else if (command_text.startsWith('amazonmusic:')) {
    service_type = 'amazonmusic';
    sonos_instruction = 'amazonmusic/now/' + command_text.slice(12);
  } else if (command_text.startsWith('playlist:')) {
    service_type = 'sonos_playlist';
    sonos_instruction = 'playlist/' + command_text.slice(9);
  } else if (command_text.startsWith('command:')) {
    service_type = 'command';
    sonos_instruction = command_text.slice(8);
  } else if (command_text.startsWith('room:')) {
    sonos_room = command_text.slice(5);
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

  let res;
  if (service_type !== 'command') {
    // if (reset_repeat) {
    //     console.log('Resetting repeat');
    //     res = await fetch(get_sonos_url('repeat/off'));
    //     if (!res.ok)
    //       console.error(
    //           `Unexpected response while turning repeat off: ${res.status}`
    //       );
    // } else {
    //     console.log('Skipping resetting repeat');
    // }   
    // await new Promise((resolve) => setTimeout(resolve, 200));
    
    if (!shuffle) {
        console.log('Resetting shuffle');
        res = await fetch(get_sonos_url('shuffle/off'));
        if (!res.ok)
        console.error(
            `Unexpected response while turning shuffle off: ${res.status}`
        );
    } else {
      console.log('Enabling shuffle');
      res = await fetch(get_sonos_url('shuffle/on'));
        if (!res.ok)
        console.error(
            `Unexpected response while turning shuffle on: ${res.status}`
        );
    }
    await new Promise((resolve) => setTimeout(resolve, 200));

    // if (reset_crossfade) {
    //     console.log('Resetting crossfade');
    //     res = await fetch(get_sonos_url('crossfade/off'));
    //     if (!res.ok)
    //     console.error(
    //         `Unexpected response while turning crossfade off: ${res.status}`
    //     );
    // } else {
    //     console.log('Skipping resetting scrossfade');
    // }
    // await new Promise((resolve) => setTimeout(resolve, 200));
    if (!keep_queue) {
      res = await fetch(get_sonos_url('clearqueue'));
      console.log('Clearing Sonos queue');
      if (!res.ok)
        console.error(
          `Unexpected response while clearing queue: ${res.status}`
        );
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  try {
    const urltoget = get_sonos_url(sonos_instruction, service_type);
    // Perform the requested action on the sonos API
    console.log('Fetching URL via HTTP api: %s', urltoget);
    res = await fetch(urltoget);
  
    if (!res.ok) {
      console.error(
        `Unexpected response while sending instruction: ${res.status}`
      );
    }
    // console.log('Sonos API reports: ', await res.json());
  } catch (e) {
    console.error(`Error while sending instruction: ${e}`);
  }


  // Wait a bit before processing next record so the API has time to respond to first command
  // e.g. want to seek on a new queue -- need the new queue to exist. Is there a way to check/confirm
  // with Sonos that a prior command is complete? I'm not sure if this a sonos thing or the http API
  // sometimes throwing commands into the ether while Sonos is busy.
  await new Promise((resolve) => setTimeout(resolve, 200));
}