
artwork is from this link
https://bendodson.com/projects/itunes-artwork-finder/

list.csv has is in the format of
```
artist,album,nfc-tag,artwork
```
the nfc tag can be a range for formats

```
<!-- album id -->
spotify:album:1ZQ2jyZ1K4XQYQY2YQZ1YQ
<!-- track id -->
spotify:track:1ZQ2jyZ1K4XQYQY2YQZ1YQ 
<!-- playlist id -->
spotify:playlist:1ZQ2jyZ1K4XQYQY2YQZ1YQ
<!-- playlists but for a user -->
spotify:user:spotify:playlist:37i9dQZF1EuTFhT4Qq3qWM
<!-- applemusic format -->
applemusic:album:1ZQ2jyZ1K4XQYQY2YQZ1YQ
<!-- command to be sent to the user -->
command:say/hi%20there
```

this list file is just a reference for me to keep track. each spotify ID is taken from the url of the album/track/playlist and is put on the card with nfc tools https://play.google.com/store/apps/details?id=com.wakdev.wdnfc&hl=en_AU&gl=US&pli=1 