import { Component, Method, EventEmitter, Event, Prop } from '@stencil/core';

@Component({
  tag: 'turn-touch'
})
export class TurnTouch {
  ch: BluetoothRemoteGATTCharacteristic;
  @Event()
  buttonPress: EventEmitter;

  mappings: { [num: number]: string } = {
    0xff00: 'Off',
    0xfe00: 'Up',
    0xfeff: 'Up Hold',
    0xfb00: 'Left',
    0xfbff: 'Left Hold',
    0xfd00: 'Right',
    0xfdff: 'Right Hold',
    0xf700: 'Down',
    0xf7ff: 'Down Hold'
  };

  @Prop() onLeft: Function;
  @Prop() onRight: Function;

  mapButton(code: number): string {
    const mapped = this.mappings[code];
    if (mapped) {
      return mapped;
    }
    return `0x${code.toString(16)}`;
  }
  private service = '99c31523-dc4f-41b1-bb04-4e4deb81fadd';
  private char = '99c31525-dc4f-41b1-bb04-4e4deb81fadd';

  @Method()
  async connect() {
    const device = await navigator.bluetooth.requestDevice({
      optionalServices: [this.service],
      filters: [{ namePrefix: 'Turn' }]
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(this.service);
    const ch = await service.getCharacteristic(this.char);
    this.ch = ch;

    await ch.startNotifications();
    this.ch.addEventListener('characteristicvaluechanged', e => {
      const value: DataView = (e.target as any).value;
      const toMap = this.mapButton(value.getUint16(0));

      this.buttonPress.emit({ button: toMap });
      this.handleCallbacks(toMap);
    });
  }
  handleCallbacks(direction: string) {
    if (this.onLeft && direction === 'Left') {
      this.onLeft();
    }
    if (this.onRight && direction === 'Right') {
      this.onRight();
    }
  }
}
