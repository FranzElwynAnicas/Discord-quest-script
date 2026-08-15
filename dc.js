(async () => {
  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest;

  window.fetch = function(url, options) {
    const urlStr = typeof url === 'string' ? url : url.url;
    if (urlStr && !urlStr.includes('discord.com') && !urlStr.startsWith('/')) {
      console.warn('[SECURITY] Blocked fetch to external URL:', urlStr);
      return Promise.reject(new Error('External request blocked by security wrapper'));
    }
    return originalFetch.apply(this, arguments);
  };

  const XHRProxy = new Proxy(window.XMLHttpRequest, {
    construct(target, args) {
      const xhr = new target(...args);
      const originalOpen = xhr.open;
      xhr.open = function(method, url, ...rest) {
        if (url && !url.includes('discord.com') && !url.startsWith('/') && !url.startsWith('?')) {
          console.warn('[SECURITY] Blocked XHR to external URL:', url);
          throw new Error('External request blocked by security wrapper');
        }
        return originalOpen.call(this, method, url, ...rest);
      };
      return xhr;
    }
  });
  window.XMLHttpRequest = XHRProxy;

  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomFloat = (min, max) => Math.random() * (max - min) + min;
  
  const humanSleep = async (baseMs, jitterPercent = 0.3) => {
    const jitter = baseMs * randomFloat(-jitterPercent, jitterPercent);
    const actualDelay = Math.max(100, baseMs + jitter);
    await new Promise(r => setTimeout(r, actualDelay));
    return actualDelay;
  };
  
  const humanThink = async () => {
    await humanSleep(random(200, 800));
  };
  
  const maybeTakeBreak = async (chance = 0.05) => {
    if (Math.random() < chance) {
      const breakDuration = random(30000, 120000);
      console.log(`[Human] Taking a short break (${Math.round(breakDuration/1000)}s)...`);
      await sleep(breakDuration);
      return true;
    }
    return false;
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  
  delete window.$;

  const wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
  webpackChunkdiscord_app.pop();

  const isLocaleProxy = v =>
    String(v?.dispatch).includes("e.get") ||
    String(v?.subscribe).includes("e.get") ||
    v?.$$loader;

  const readExports = exp => {
    if (!exp || (typeof exp !== "object" && typeof exp !== "function")) return [];
    return Reflect.ownKeys(exp).flatMap(k => {
      try { return [{ key: k, value: exp[k] }]; }
      catch { return []; }
    });
  };

  const findExport = predicate => {
    for (const [id, m] of Object.entries(wpRequire.c)) {
      for (const { key, value } of readExports(m.exports)) {
        try {
          if (predicate(value, key, m)) return { id, key, value, module: m };
        } catch { }
      }
    }
    return null;
  };

  const QuestsStore = findExport(v => v?.getQuest && v.quests instanceof Map)?.value;
  const ApplicationStreamingStore = findExport(v => v?.getStreamerActiveStreamMetadata)?.value;
  const RunningGameStore = findExport((v, k) => k === "Ay" && typeof v?.getRunningGames === "function" && typeof v?.getGameForPID === "function")?.value;
  const ChannelStore = findExport(v => typeof v?.getAllThreadsForParent === "function" && typeof v?.getSortedPrivateChannels === "function")?.value;
  const GuildChannelStore = findExport((v, k) => k === "Ay" && typeof v?.getSFWDefaultChannel === "function" && typeof v?.getAllGuilds === "function")?.value;
  const FluxDispatcher = findExport(v => !isLocaleProxy(v) && typeof v?.dispatch === "function" && typeof v?.subscribe === "function" && typeof v?.flushWaitQueue === "function")?.value;
  const api = findExport((v, k) => k === "Bo" && ["get", "post", "put", "patch", "del"].every(m => typeof v?.[m] === "function"))?.value;

  console.log('[SECURITY] API object found, all requests will go through Discord client');

  const SUPPORTED_TASKS = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
  const isApp = typeof DiscordNative !== "undefined";

  const fakeGamesMap = new Map();
  let realGetRunningGames, realGetGameForPID, realStreamMetadata;

  const dispatchGames = () =>
    FluxDispatcher.dispatch({
      type: "RUNNING_GAMES_CHANGE",
      removed: [],
      added: [...fakeGamesMap.values()],
      games: [...fakeGamesMap.values()],
    });

  const restoreAll = () => {
    if (realGetRunningGames) RunningGameStore.getRunningGames = realGetRunningGames;
    if (realGetGameForPID) RunningGameStore.getGameForPID = realGetGameForPID;
    if (realStreamMetadata) ApplicationStreamingStore.getStreamerActiveStreamMetadata = realStreamMetadata;
  };

  const getTaskName = quest => {
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    return SUPPORTED_TASKS.find(t => taskConfig.tasks[t]);
  };

  const readHeartbeatProgress = (quest, data, taskName) =>
    quest.config.configVersion === 1
      ? (data.userStatus?.streamProgressSeconds ?? 0)
      : Math.floor(data.userStatus?.progress?.[taskName]?.value ?? 0);

  const enrollQuest = async (questId, questName) => {
    console.log(`[Enroll] ${questName}`);
    await humanThink();
    try {
      await api.post({ url: `/quests/${questId}/enroll` });
      await humanSleep(random(1500, 4000));
    } catch (e) {
      console.log(`[Enroll] Failed for ${questName}:`, e?.message ?? e);
    }
  };

  const processVideoQuest = async (quest, taskName, target) => {
    const name = quest.config.messages.questName;
    let progress = quest.userStatus?.progress?.[taskName]?.value ?? 0;
    let completed = false;

    console.log(`[Video] Starting: ${name}`);
    await humanSleep(random(1000, 5000));

    while (progress < target) {
      const speed = randomFloat(5, 10);
      const remaining = Math.min(speed, target - progress);
      const delay = randomFloat(5000, 15000);
      await sleep(delay);

      if (await maybeTakeBreak(0.03)) {
        continue;
      }

      const timestamp = Math.min(target, progress + speed + randomFloat(-1, 2));
      
      try {
        const res = await api.post({
          url: `/quests/${quest.id}/video-progress`,
          body: { timestamp: Math.round(timestamp) },
        });
        progress = timestamp;
        completed = !!res.body.completed_at;
        
        if (Math.random() < 0.7) {
          console.log(`[Video] ${name}: ${Math.floor(progress)}/${target}s`);
        }
        
        if (completed) break;
      } catch (e) {
        console.log(`[Video] ${name} heartbeat failed:`, e?.message ?? e);
        await humanSleep(random(5000, 15000));
      }
    }

    await humanSleep(random(500, 2000));
    if (!completed) {
      try {
        await api.post({
          url: `/quests/${quest.id}/video-progress`,
          body: { timestamp: target },
        });
        await humanSleep(random(500, 1500));
      } catch (e) {
        console.log(`[Video] ${name} final heartbeat failed:`, e?.message ?? e);
      }
    }

    await humanSleep(random(2000, 8000));
    console.log(`[Video] Completed: ${name}`);
  };

  const createFakeGame = (appData, applicationId) => {
    const pid = Math.floor(Math.random() * 30000) + 1000;
    const safe = (appData.name || "UnknownGame").replace(/\s/g, "");
    const lower = safe.toLowerCase();

    const exeNames = [`${safe}.exe`, `${safe}64.exe`, `${safe}_x64.exe`];
    const installPaths = [
      `c:/program files/${lower}/${lower}.exe`,
      `c:/program files (x86)/${lower}/${lower}.exe`,
      `c:/games/${lower}/${lower}.exe`,
      `d:/games/${lower}/${lower}.exe`
    ];
    
    const exeIndex = Math.floor(Math.random() * exeNames.length);
    const pathIndex = Math.floor(Math.random() * installPaths.length);

    return {
      id: applicationId, 
      name: appData.name, 
      pid,
      pidPath: [pid], 
      start: Date.now() - random(300000, 3600000),
      exeName: exeNames[exeIndex],
      exePath: installPaths[pathIndex],
      processName: safe,
      cmdLine: `"${installPaths[pathIndex].replace(/\//g, '\\')}"`,
      hidden: false, 
      isLauncher: Math.random() < 0.1,
    };
  };

  const processGameQuest = async (quest, taskName, target, applicationId) => {
    const name = quest.config.messages.questName;

    if (!applicationId) {
      console.log(`[Game] ${name}: no applicationId, skipping.`);
      return;
    }

    if (!isApp) {
      console.log(`[Game] ${name}: requires desktop app, skipping.`);
      return;
    }

    await humanThink();

    let appData;
    try {
      const res = await api.get({
        url: `/applications/public?application_ids=${applicationId}`,
      });
      appData = res.body[0];
      await humanSleep(random(500, 1500));
    } catch (e) {
      console.log(`[Game] Failed to fetch app data for ${name}:`, e?.message ?? e);
      return;
    }

    const fakeGame = createFakeGame(appData, applicationId);
    fakeGamesMap.set(fakeGame.pid, fakeGame);
    dispatchGames();

    await humanSleep(random(2000, 8000));

    const secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
    console.log(`[Game] Playing: ${appData.name}. Need ${Math.ceil((target - secondsDone) / 60)} more minutes.`);

    await new Promise(resolve => {
      const onHeartbeat = data => {
        if (data.userStatus?.questId !== quest.id) return;
        const progress = readHeartbeatProgress(quest, data, taskName);
        
        if (Math.random() < 0.4) {
          console.log(`[Game] ${name}: ${progress}/${target}s`);
        }

        if (progress >= target) {
          setTimeout(async () => {
            fakeGamesMap.delete(fakeGame.pid);
            dispatchGames();
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
            await humanSleep(random(2000, 10000));
            console.log(`[Game] Completed: ${name}`);
            resolve();
          }, random(1000, 5000));
        }
      };
      FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
    });
  };

  const processStreamQuest = async (quest, taskName, target, applicationId) => {
    const name = quest.config.messages.questName;

    if (!applicationId) {
      console.log(`[Stream] ${name}: no applicationId, skipping.`);
      return;
    }

    if (!isApp) {
      console.log(`[Stream] ${name}: requires desktop app, skipping.`);
      return;
    }

    await humanThink();

    const pid = Math.floor(Math.random() * 30000) + 1000;

    await humanSleep(random(3000, 10000));

    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
      id: applicationId,
      pid,
      sourceName: Math.random() < 0.3 ? "Game Capture" : "Display Capture",
    });

    const secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
    console.log(`[Stream] Streaming: ${name}. Need ${Math.ceil((target - secondsDone) / 60)} more minutes.`);
    console.log(`[Stream] Need another person in VC!`);

    await new Promise(resolve => {
      const onHeartbeat = data => {
        if (data.userStatus?.questId !== quest.id) return;
        const progress = readHeartbeatProgress(quest, data, taskName);
        
        if (Math.random() < 0.3) {
          console.log(`[Stream] ${name}: ${progress}/${target}s`);
        }

        if (progress >= target) {
          setTimeout(() => {
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
            setTimeout(async () => {
              await humanSleep(random(1000, 5000));
              console.log(`[Stream] Completed: ${name}`);
              resolve();
            }, random(1000, 3000));
          }, random(2000, 8000));
        }
      };
      FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
    });
  };

  const processActivityQuest = async (quest, taskName, target) => {
    const name = quest.config.messages.questName;

    await humanThink();

    const channelId =
      ChannelStore.getSortedPrivateChannels()[0]?.id ??
      Object.values(GuildChannelStore.getAllGuilds())
        .find(x => x != null && x.VOCAL.length > 0)?.VOCAL[0]?.channel?.id;

    if (!channelId) {
      console.log(`[Activity] ${name}: no voice channel found, skipping.`);
      return;
    }

    const streamKey = `call:${channelId}:1`;
    console.log(`[Activity] Starting: ${name}`);
    await humanSleep(random(1000, 5000));

    let heartbeatCount = 0;
    while (true) {
      heartbeatCount++;
      
      if (heartbeatCount % random(3, 7) === 0) {
        await humanSleep(random(500, 2000));
      }

      if (await maybeTakeBreak(0.02)) {
        continue;
      }

      let progress;
      try {
        const res = await api.post({
          url: `/quests/${quest.id}/heartbeat`,
          body: { stream_key: streamKey, terminal: false },
        });
        progress = res.body.progress.PLAY_ACTIVITY.value;
        
        if (Math.random() < 0.3) {
          console.log(`[Activity] ${name}: ${progress}/${target}s`);
        }
      } catch (e) {
        console.log(`[Activity] ${name} heartbeat failed:`, e?.message ?? e);
        await humanSleep(random(15000, 30000));
        continue;
      }

      if (progress >= target) {
        await humanSleep(random(1000, 5000));
        try {
          await api.post({
            url: `/quests/${quest.id}/heartbeat`,
            body: { stream_key: streamKey, terminal: true },
          });
          await humanSleep(random(500, 2000));
        } catch (e) {
          console.log(`[Activity] ${name} terminal heartbeat failed:`, e?.message ?? e);
        }
        break;
      }

      await humanSleep(random(15000, 35000));
    }

    await humanSleep(random(2000, 8000));
    console.log(`[Activity] Completed: ${name}`);
  };

  const processQuest = async quest => {
    const name = quest.config.messages.questName;
    const taskName = getTaskName(quest);
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    const taskData = taskConfig.tasks[taskName];
    const target = taskData.target;
    const applicationId = quest.config.application?.id ?? taskData.applications?.[0]?.id;

    await humanSleep(random(500, 2000));

    if (!quest.userStatus?.enrolledAt) {
      await enrollQuest(quest.id, name);
    }

    if (Math.random() < 0.1) {
      await humanSleep(random(5000, 15000));
    }

    if (taskName.includes("WATCH_VIDEO")) {
      await processVideoQuest(quest, taskName, target);
    } else if (taskName === "PLAY_ON_DESKTOP") {
      await processGameQuest(quest, taskName, target, applicationId);
    } else if (taskName === "STREAM_ON_DESKTOP") {
      await processStreamQuest(quest, taskName, target, applicationId);
    } else if (taskName === "PLAY_ACTIVITY") {
      await processActivityQuest(quest, taskName, target);
    }

    await humanSleep(random(2000, 8000));
  };

  const processAllQuests = async () => {
    realGetRunningGames = RunningGameStore.getRunningGames;
    realGetGameForPID = RunningGameStore.getGameForPID;
    realStreamMetadata = ApplicationStreamingStore.getStreamerActiveStreamMetadata;

    RunningGameStore.getRunningGames = () => [...fakeGamesMap.values()];
    RunningGameStore.getGameForPID = pid => fakeGamesMap.get(pid);

    let loopCount = 0;

    while (true) {
      loopCount++;
      
      const checkDelay = random(30000, 90000);
      
      console.log(`\n${'='.repeat(50)}`);
      console.log(`[QuestManager] Checking for quests (loop #${loopCount})...`);
      console.log(`${'='.repeat(50)}`);

      const pending = [...QuestsStore.quests.values()].filter(q =>
        !q.userStatus?.completedAt &&
        Date.now() < new Date(q.config.expiresAt).getTime() &&
        SUPPORTED_TASKS.some(t =>
          Object.keys((q.config.taskConfig ?? q.config.taskConfigV2).tasks).includes(t)
        )
      );

      if (!pending.length) {
        console.log(`[QuestManager] No pending quests. Next check in ${Math.round(checkDelay/1000)}s...`);
        await humanSleep(checkDelay);
        continue;
      }

      console.log(`[QuestManager] Found ${pending.length} quest(s).`);

      const streamQuests = pending.filter(q => getTaskName(q) === "STREAM_ON_DESKTOP");
      const otherQuests = pending.filter(q => getTaskName(q) !== "STREAM_ON_DESKTOP");

      const shuffledOthers = otherQuests.sort(() => Math.random() - 0.5);

      for (const quest of shuffledOthers) {
        await processQuest(quest);
        await humanSleep(random(5000, 20000));
      }

      for (const quest of streamQuests) {
        await processQuest(quest);
        await humanSleep(random(5000, 15000));
      }

      console.log('[QuestManager] Batch completed.');

      if (fakeGamesMap.size > 0) {
        fakeGamesMap.clear();
        dispatchGames();
        await humanSleep(random(500, 1500));
      }

      const waitTime = random(30000, 120000);
      console.log(`[QuestManager] Next check in ${Math.round(waitTime/1000)}s...`);
      await humanSleep(waitTime);
    }
  };

  console.clear();
  console.log('========================================');
  console.log('[QuestManager] Starting humanized quest completion...');
  console.log('[SECURITY] Network requests are being monitored');
  console.log('[Human] Random delays and behaviors added for realism');
  console.log('[QuestManager] To stop: reload Discord (Ctrl+R)');
  console.log('========================================\n');

  try {
    await processAllQuests();
  } catch (e) {
    console.error('[QuestManager] Error:', e);
    restoreAll();
    window.fetch = originalFetch;
    window.XMLHttpRequest = originalXHR;
  }
})();
