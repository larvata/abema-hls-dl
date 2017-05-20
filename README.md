# abema-hls-dl

----

abemaTV的下载工具, 使用了Promise, 需要nodejs 6.4+

```
> node . --help

  Usage: abema-hls-dl [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -l, --list                 list all of the available channels
    -c, --channel <channelId>  channel id for recording, default: abema-news
    -d, --duration <duration>  recording duration(minute) default: 30
    -p, --proxy <proxy>        proxy setting, default: null
    -s, --savecache            save origin ts file for backup

```


### 使用方法

```
# 获取频道Id
> node . --list                                         


# 下载2分钟麻将 国内下载需自备代理 任意日本IP即可
> node . -c mahjong -d 2 -p socks://127.0.0.1:8484

```

  
### 已知问题

+ 无法录制有版权保护并且无法在网页版播放的番组
+ 遇到录档无法剪辑的情况 需要对其remux 

    `ffmpeg -i in.ts -vcodec copy -acodec copy -bf:v 0 out.ts`


### 关于abemaTV的区域限制

2016年12月 abemaTV对访问的IP实行了严格的限制 屏蔽了绝大部分日本vps的IP 导致即使用日本代理访问也无法观看番组
如果仅仅是希望绕过这一限制 可以使用这个油猴脚本

https://openuserjs.org/scripts/Larvata/AbemaTV_region_free