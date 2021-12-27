import { NFC } from 'nfc-pcsc';
import sonos_nfc from './sonos_nfc.js';

const nfc = new NFC();

sonos_nfc(nfc);
