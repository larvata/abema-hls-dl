# abema-hls-dl

abemaTV的下载工具, 需要 nodejs > 6.4

### 安装

```
# 下载代码并安装依赖库
git clone https://github.com/larvata/abema-hls-dl.git
cd abema-hls-dl
npm install
```

### 参数列表

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
    -r, --resolution <number>  video resolution, one of 360/480/720/1080, default: 1080

```


### 使用方法

```
# 获取频道Id
> node . --list


# 下载2分钟480p的分辨率的麻将 国内下载需自备代理 任意日本IP即可
> node . -c mahjong -d 2 -r 480 -p socks://127.0.0.1:8484

```

### 已知问题

+ 目前没有实现Dash模块 部分频道无法录制
+ 遇到录档无法剪辑的情况 可能需要对其remux

    `ffmpeg -i in.ts -c copy output.mp4`


### 关于abemaTV的区域限制

2016年12月 abemaTV对访问的IP实行了严格的限制 屏蔽了绝大部分日本vps的IP 导致即使用日本代理访问也无法观看番组
如果仅仅是希望绕过这一限制 可以使用这个油猴脚本

https://openuserjs.org/scripts/Larvata/AbemaTV_region_free