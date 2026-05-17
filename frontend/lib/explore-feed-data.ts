export interface ExploreFeedPost {
  id: string
  author: string
  handle: string
  avatar: string
  timeAgo: string
  captionHi: string
  hashtagHi: string
  imageGradient: string
  likes: string
  comments: string
  shares: string
  isFollowing?: boolean
}

export const exploreFeedPosts: ExploreFeedPost[] = [
  {
    id: '1',
    author: 'Desi Memes HQ',
    handle: '@desimemeshq',
    avatar: '😂',
    timeAgo: '12m',
    captionHi: 'जब मॉम बोले “एक और रोटी खा ले” और तुम पहले से ही फुल हो 😭',
    hashtagHi: '#DesiMom',
    imageGradient: 'from-amber-400 via-orange-500 to-rose-500',
    likes: '24.1K',
    comments: '1.2K',
    shares: '890',
  },
  {
    id: '2',
    author: 'Cricket Fan India',
    handle: '@cricketfanin',
    avatar: '🏏',
    timeAgo: '28m',
    captionHi: 'आज के मैच का ये मोमेंट सबके स्टेटस पर है — कमेंट में अपनी टीम बताओ!',
    hashtagHi: '#CricketFever',
    imageGradient: 'from-blue-500 via-indigo-500 to-violet-600',
    likes: '18.5K',
    comments: '2.4K',
    shares: '1.1K',
    isFollowing: true,
  },
  {
    id: '3',
    author: 'Bollywood Buzz',
    handle: '@bollybuzz',
    avatar: '🎬',
    timeAgo: '45m',
    captionHi: 'नई ट्रेलर रिलीज़ — सीन एक से बढ़कर एक! क्या आप भी वेट कर रहे थे?',
    hashtagHi: '#Bollywood',
    imageGradient: 'from-fuchsia-500 via-pink-500 to-rose-400',
    likes: '31K',
    comments: '3.8K',
    shares: '2.2K',
  },
  {
    id: '4',
    author: 'Street Food Delhi',
    handle: '@delhistreetfood',
    avatar: '🍜',
    timeAgo: '1h',
    captionHi: 'लोकों की लाइन देखो — यही असली रिव्यू है। कौन-सा शहर का फेवरेट है?',
    hashtagHi: '#IndianFood',
    imageGradient: 'from-lime-400 via-emerald-500 to-teal-600',
    likes: '9.2K',
    comments: '640',
    shares: '420',
  },
  {
    id: '5',
    author: 'Tech Hindi',
    handle: '@techhindi',
    avatar: '📱',
    timeAgo: '2h',
    captionHi: 'बजट फोन में भी अब कैमरा काफी सही आ गया — क्या आप अपग्रेड करोगे?',
    hashtagHi: '#TechIndia',
    imageGradient: 'from-slate-600 via-slate-700 to-slate-900',
    likes: '5.6K',
    comments: '312',
    shares: '198',
  },
  {
    id: '6',
    author: 'Festival Vibes',
    handle: '@festivalvibes',
    avatar: '🪔',
    timeAgo: '3h',
    captionHi: 'घर की सजावट शुरू — अपनी रील्स का पहला फ्रेम शेयर करो!',
    hashtagHi: '#Tyohar',
    imageGradient: 'from-yellow-400 via-amber-500 to-orange-600',
    likes: '12K',
    comments: '980',
    shares: '560',
  },
]
