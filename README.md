# abema-hls-dl

----

abemaTV的下载工具, node 6.4+

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

```


使用方法
```
# 获取频道Id
> node . --list                                         


# 下载2分钟麻将 国内下载需自备代理
>node . -c mahjong -d 2 -p socks://127.0.0.1:8484

```