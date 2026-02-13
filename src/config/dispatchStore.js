const time = 5 * 60 * 1000

let dispatchConfig = {
  eletronicos: {
    start: "11:30",
    end: "12:00",
    interval: time
  },
  academia: {
    start: "11:30",
    end: "12:00",
    interval: time
  },
  moda: {
    start: "11:30",
    end: "12:00",
    interval: time
  }
};

function getConfig() {
  return dispatchConfig;
}

function updateConfig(newConfig) {
  dispatchConfig = {
    ...dispatchConfig,
    ...newConfig
  };

  console.log('[Dispatcher] Config atual:', dispatchConfig);
}

module.exports = {
  getConfig,
  updateConfig
};
