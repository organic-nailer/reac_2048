import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <Field/>
    </div>
  );
}

type FieldState = {
  tilesPool: TileData[]
};

enum SwipeDirection {
  up, down, left, right
};

class Field extends React.Component<{},FieldState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      tilesPool: []
    }
  }

  componentDidMount() {
    this.addTile(2);
    document.addEventListener("keydown", this.onKeyDown, false);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown, false);
  }

  onKeyDown = (ev: KeyboardEvent) => {
    switch(ev.key) {
      case "ArrowUp": {
        this.onSwipe(SwipeDirection.left);
        break;
      }
      case "ArrowRight": {
        this.onSwipe(SwipeDirection.down);
        break;
      }
      case "ArrowLeft": {
        this.onSwipe(SwipeDirection.up);
        break;
      }
      case "ArrowDown": {
        this.onSwipe(SwipeDirection.right);
        break;
      }
    }
  }

  uniqueValue = 0;
  canSwipe = true;
  tilesMap = new Map<number,TileData>();
  removePool: TileData[] = [];

  readonly xLength = 4;
  readonly yLength = 4;

  addTile = (num: number = 1) => {
    if(this.tilesMap.size >= this.xLength * this.yLength) return;
    let addedLength = 0;
    const willAdd: TileData[] = [];
    while(addedLength < num) {
      const randomX = this.randRange(this.xLength);
      const randomY = this.randRange(this.yLength);
      const randomValue = this.randRange(2) ? 2 : 4;
      if(!this.tilesMap.has(randomX * 10 + randomY)) {
        const newTile: TileData = { key: this.uniqueValue++, value: randomValue };
        const newKey = randomX * 10 + randomY;
        this.tilesMap.set(newKey, newTile);
        newTile.positionX = randomX;
        newTile.positionY = randomY;
        willAdd.push(newTile);
        addedLength++;
      }
    }
    this.setState({
      tilesPool: [...this.state.tilesPool, ...willAdd]
    });
  }

  tiltBoard = (direction : SwipeDirection) => {
    //tilesPool.clear();
    const newPool: TileData[] = [];
    let scanAxisIsX: boolean;
    let scanDirection: number;

    switch(direction) {
      case SwipeDirection.up:
        console.log("↑");
        scanAxisIsX = false;
        scanDirection = 1;
        break;
      case SwipeDirection.down:
        console.log("↓");
        scanAxisIsX = false;
        scanDirection = -1;
        break;
      case SwipeDirection.left:
        console.log("←");
        scanAxisIsX = true;
        scanDirection = 1;
        break;
      case SwipeDirection.right:
        console.log("→");
        scanAxisIsX = true;
        scanDirection = -1;
        break;
    }

    let moved = false;
    for(let moveAxisIndex = 0; moveAxisIndex < (scanAxisIsX ? this.yLength : this.xLength); moveAxisIndex++) {
      let oldArrayCursor = scanDirection > 0 ? 0 : this.xLength - 1;
      let newArrayCursor = oldArrayCursor;
      while(oldArrayCursor < this.xLength && oldArrayCursor >= 0) {
        if(oldArrayCursor != newArrayCursor
            && this.tilesMap.has(this.genKey(oldArrayCursor, moveAxisIndex, scanAxisIsX))) {
          if(this.tilesMap.has(this.genKey(newArrayCursor, moveAxisIndex, scanAxisIsX))) {
            if(this.tilesMap.get(this.genKey(oldArrayCursor, moveAxisIndex, scanAxisIsX))?.value
                == this.tilesMap.get(this.genKey(newArrayCursor, moveAxisIndex, scanAxisIsX))?.value) {
              this.tilesMap.get(this.genKey(newArrayCursor, moveAxisIndex, scanAxisIsX))!.value *= 2;
              var upScore = this.tilesMap.get(this.genKey(newArrayCursor, moveAxisIndex, scanAxisIsX))?.value;
              var newKey = this.genKey(newArrayCursor, moveAxisIndex, scanAxisIsX);
              newArrayCursor += scanDirection;
              var oldKey = this.genKey(oldArrayCursor, moveAxisIndex, scanAxisIsX);
              const targetTile = this.tilesMap.get(oldKey)!;
              targetTile.positionX = Math.floor(newKey / 10);
              targetTile.positionY = newKey % 10;
              newPool.push(targetTile);
              this.removePool.push(targetTile);
              this.tilesMap.delete(this.genKey(oldArrayCursor, moveAxisIndex, scanAxisIsX));
              moved = true;
            }
            else {
              newArrayCursor += scanDirection;
              if(oldArrayCursor != newArrayCursor) {
                this.tilesMap.set(
                  this.genKey(newArrayCursor, moveAxisIndex, scanAxisIsX),
                  this.tilesMap.get(this.genKey(oldArrayCursor, moveAxisIndex, scanAxisIsX))!
                );
                this.tilesMap.delete(this.genKey(oldArrayCursor, moveAxisIndex, scanAxisIsX));
                moved = true;
              }
            }
          }
          else {
            this.tilesMap.set(
              this.genKey(newArrayCursor, moveAxisIndex, scanAxisIsX),
              this.tilesMap.get(this.genKey(oldArrayCursor, moveAxisIndex, scanAxisIsX))!
            );
            this.tilesMap.delete(this.genKey(oldArrayCursor, moveAxisIndex, scanAxisIsX));
            moved = true;
          }
        }
        oldArrayCursor += scanDirection;
      }
    }
    this.tilesMap.forEach((k, v) => {
      const target = k;
      target.positionX = Math.floor(v / 10);
      target.positionY = v % 10;
      newPool.push(target);
    });
    this.setState({
      tilesPool: newPool
    });
    return moved;
  }

  genKey = (scanAxis: number, moveAxis: number, scanAxisIsX: boolean): number => {
    return scanAxisIsX ? scanAxis * 10 + moveAxis : moveAxis * 10 + scanAxis;
  }


  onSwipe = (direction: SwipeDirection) => {
    if(!this.canSwipe) return;
    this.canSwipe = false;
    let moved = this.tiltBoard(direction);
    //printBoard();
    if(!moved) {
      console.log("移動できません");
      this.canSwipe = true;
      return;
    }
    window.setTimeout(() => {
      this.addTile();
      const newPool = this.state.tilesPool.filter((t) => !this.removePool.includes(t));
      this.removePool = [];
      this.setState({
        tilesPool: newPool
      });

      // if(!alreadyCleared && tilesPool.any((e) => e.value >= 2021)) {
      //   alreadyCleared = true;
      //   setState(() {
      //     clearVisible = true;
      //   });
      // }

      // if(!canTilt()) {
      //   setState(() {
      //     failedVisible = true;
      //   });
      // }
      this.canSwipe = true;
      this.printBoard();
    }, 100)
  }

  canTilt = (): boolean => {
    if(this.state.tilesPool.length <= 15) return true;
    for(let row = 0; row < this.yLength; row++) {
      for(let col = 0; col < this.xLength - 1; col++) {
        if(this.tilesMap.get(col * 10 + row)?.value == this.tilesMap.get((col+1) * 10 + row)?.value) {
          return true;
        }
      }
    }
    for(let col = 0; col < this.xLength; col++) {
      for(let row = 0; row < this.yLength - 1; row++) {
        if(this.tilesMap.get(col * 10 + row)?.value == this.tilesMap.get(col * 10 + row + 1)?.value) {
          return true;
        }
      }
    }
    return false;
  }

  printBoard = () => {
    console.log("----");
    let res = new Array(this.yLength).fill(0).map((i) => new Array(this.xLength).fill(0).map((i) => "__"));
    for (let value of this.state.tilesPool) {
      if(res[value.positionY!][value.positionX!] != "__") {
        res[value.positionY!][value.positionX!] += "&" + value.value.toString();
      }
      else {
        res[value.positionY!][value.positionX!] = value.value.toString();
      }
    }
    for (var row of res) {
      console.log(row.join(" "));
    }
    console.log("----");
  }

  randRange = (max: number) => Math.floor(Math.random() * max);

  onClicked = () => {
    this.addTile();
    this.setState({});
  }

  render() {
    const backgroundTiles = new Array(16).fill(0).map((_,i) => {
      return (
        <div className="BackgroundTile" key={-i}>
        </div>
      );
    });
    const tiles = this.state.tilesPool.map((d) => {
      return (
        <Tile data={d} key={d.key}/>
      );
    });
    return (
      <div>
      <div className="Field">
        {backgroundTiles}
        {tiles}
      </div>
      </div>
    );
  }
}

type TileData = {
  readonly key: number,
  value: number,
  positionX?: number,
  positionY?: number
};

function Tile(props: {data: TileData}) {
  const row = props.data.positionX ?? 0;
  const column = props.data.positionY ?? 0;
  const top = row * 0.25 * 100;
  const left = column * 0.25 * 100;
  return (
    <div style={{ top: `${top}%`, left: `${left}%`, backgroundColor: valueColor(props.data.value) }} className="Tile">
      {props.data.value}
    </div>
  )
}

function valueColor(value: number) {
  if(value <= 2) return "#6D4C41";
  if(value <= 4) return "#4E342E";
  if(value <= 8) return "#FF9800";
  if(value <= 16) return "#FF5722";
  if(value <= 32) return "#ff1744";
  if(value <= 64) return "#f44336";
  if(value <= 128) return "#4CAF50";
  if(value <= 256) return "#2E7D32";
  if(value <= 512) return "#2196F3";
  if(value <= 1024) return "#607D8B";
  if(value <= 2048) return "#212121";
  else return "#651FFF";
}

export default App;
