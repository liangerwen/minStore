class Store {
  constructor(options) {
    let state = options?.state ?? {};
    let getters = options?.getters ?? {};
    let mutations = options?.mutations ?? {};
    this.status = "resting";
    this.event = new Bus();
    var self = this;
    this.state = new Proxy(state, {
      set(state, key, val) {
        if (self.status === "commit") {
          state[key] = val;
        } else {
          console.error("请通过commit来更改state");
        }
      },
    });
    this.getters = getters;
    for (var key in mutations) {
      if (mutations.hasOwnProperty(key)) {
        this.event.emit(key, mutations[key]);
      }
    }
    this.mutations = new Proxy(mutations, {
      get(mutations, key) {
        if (self.status === "commit") {
          return mutations[key];
        } else {
          console.error("请通过commit来调用mutations");
        }
      },
      set(state, key, val) {
        return;
      },
    });

    Object.keys(this.state).forEach((key) => {
      Object.defineProperty(self, key, {
        get() {
          return self.state[key];
        },
      });
    });

    Object.keys(this.getters).forEach((key) => {
      Object.defineProperty(self, key, {
        get() {
          return self.getters[key].length <= 2
            ? self.getters[key](self.state, self)
            : console.error("getter最多只能接收两个参数");
        },
      });
    });
  }

  commit(event, params = []) {
    this.status = "commit";
    this.event.on(event, this, this.state, ...params);
    this.status = "resting";
  }
}

class Bus {
  constructor() {
    this.sub = [];
  }
  emit(key, callback) {
    if (this.sub.find((r) => r.key === key) == null) {
      this.sub.push({ key: key, callback: callback });
    } else {
      var index = this.sub.findIndex((r) => r.key === key);
      this.sub[index].callback = callback;
    }
  }
  on(key, ctx = null, ...args) {
    if (this.sub.find((r) => r.key === key) != null) {
      var index = this.sub.findIndex((r) => r.key === key);
      this.sub[index].callback.call(ctx, ...args);
    }
  }
}
