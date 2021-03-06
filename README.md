# Web Page Media Keys

**Web Page Media Keys** is an extension for Google Chrome browser, that provides bindings from keyboard media keys 
to a web page. It allows your keyboard media keys (play/pause, next, previous) to work when you're listening to music
on common streaming websites.

## Supported Services

Currently supported services:

   * 163 Music
   * 22tracks
   * 8tracks
   * Amazon Cloud Player
   * Bandcamp
   * Birp
   * Bop
   * Bugs Music
   * Chrome Built-In Player
   * Comcast/Xfinity
   * Deezer
   * Digitally Imported (di.fm)
   * Gaana.com
   * Google Play Music
   * Groove Music
   * Hype Machine
   * iloveradio.de
   * Jamstash
   * Jango.com
   * JB Hi-Fi Now
   * Livestream.com
   * Mixcloud
   * Music Choice
   * Myspace
   * Myzuka.fm
   * Naxos Music Library
   * Netflix
   * Noon Pacific
   * NRK Radio
   * Ok.ru
   * Overcast
   * Pandora
   * Phish Tracks
   * Pleer.com
   * Picarto.tv
   * Plex
   * Pocketcasts.com
   * Prostopleer
   * Qobuz
   * Rdio
   * Relax-Hub.com
   * Saavn.com
   * Slacker
   * Sirius XM Radio
   * SomaFM
   * Songza
   * Soundcloud
   * Sowndhaus
   * Spotify
   * Spreaker
   * Streamsquid
   * Subsonic (and Madsonic)
   * Superplayer.fm
   * Synology Audio Station v.5
   * thesixtyone
   * Tidal
   * Tracksflow.com
   * tunein.com
   * Twitch.tv
   * Ustream.tv
   * Vimeo
   * vk.com (Vkontakte)
   * Xiami Music
   * YouTube
   * Zvooq
   * Яндекс.Музыка (Yandex.Music)
   * Яндекс.Радио (Yandex.Radio)

## Integrate Web Page Media Keys With Any Site

There is two ways of integration:

1. Write a plugin for given web site (service).
2. Implement generic [Web Page Media Control API][wpmca] from the service side.

The first way is the only possible when you are not the site owner and it's impossible
to ask site owner to implement Web Page Media Control API. In this case you can
implement plugin (see other plugins -- files in `extension` directory with names
started with `keysocket-`) and create pull request to merge your code into repository.
After merge is done and extension is updated you'll enjoy the result.

The second way is the right way when you are a site owner. There is no need to
write a plugin if your can just put a few lines of code into your site. Detailed
description of API available in [Web Page Media Control API][wpmca] repo. As
an example of working Web Page Media Control API implementation see
[RelaxHub](http://relax-hub.com/).

## Usage

1. Install extension from the [chrome web store][crx].
2. Edit the `Keyboard shortcuts` to give the extension 'Global' permissions:
    * open a browser tab to [chrome://extensions](chrome://extensions)
    * scroll to the bottom & click `Keyboard shortcuts`
    * find `Web Page Media Keys` and change each desired key to `Global`

## Contribute, Please!

Feel free to create pull requests for new adapters for other music players and bug-fixes.

## Copyrights

This software is maintained by [Valera Leontyev][vl] (feedbee@gmail.com) and licensed by 
Apache 2.0. Original version of the extension created by [Boris Smus][bs] and named
[keysocket][ks]. [Extension icon][icon] created by [José García][jg].

[vl]: https://github.com/feedbee
[bs]: https://github.com/borismus
[ks]: https://github.com/borismus/keysocket
[crx]: https://chrome.google.com/webstore/detail/web-page-media-keys/gndhohcpfmjgggkgkfafpchcnefnhhmc
[icon]: https://www.iconfinder.com/icons/306926/multimedia_music_play_video_icon
[jg]: https://www.iconfinder.com/josealonsogarcia
[wpmca]: https://github.com/feedbee/web-page-media-control-api-spec