Word recitation clips — تلاوة الكلمات
=====================================

The game ships with real Qur'an word-by-word recitation, one clip per word:

    noor.mp3     (نُور)      recited from 24:35
    qamar.mp3    (قَمَر)     recited from 54:1
    shams.mp3    (شَمْس)     recited from 91:1
    maa.mp3      (مَاء)      recited from 23:18
    bahr.mp3     (بَحْر)     recited from 24:40
    jabal.mp3    (جَبَل)     recited from 59:21
    amal.mp3     (عَمَل)     recited from 18:30
    layl.mp3     (لَيْل)     recited from 17:1
    kitab.mp3    (كِتَاب)    recited from 2:2
    samaa.mp3    (سَمَاء)    recited from 2:22
    shifaa.mp3   (شِفَاء)    recited from 16:69
    rahma.mp3    (رَحْمَة)   recited from 10:57

Source: Qur'an word-by-word audio (audio.qurancdn.com, Quran.com). The exact
ayah and word position of every clip was resolved and verified by
`node tools/resolve-audio.js` against api.quran.com.

Playback order used by the game:
    1. audio/<id>.mp3|ogg|webm|m4a   (these files)
    2. the online word-by-word clip for the word
    3. the browser's speech synthesis (often unavailable on Linux)

You can replace any file with your own recitation — keep the same file name.
Delete a file to make the game fall back to the online clip.
