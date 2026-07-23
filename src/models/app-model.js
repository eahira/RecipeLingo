export class AppModel {
  constructor() {
    this.state = {
      recipes: [],
      favorites: [],
      vocabulary: []
    };
  }

  getState() {
    return this.state;
  }
}

