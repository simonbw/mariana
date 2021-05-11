import snd_musicalNope from "../../../resources/audio/ui/musical_nope.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { V } from "../../core/Vector";
import { OceanAmbience } from "../audio/OceanAmbience";
import { Boat } from "../Boat";
import { Diver, getDiver } from "../diver/Diver";
import { Water } from "../environment/Background";
import { Sky } from "../environment/Sky";
import { isFish } from "../fish/BaseFish";
import { ClownFish } from "../fish/passive/ClownFish";
import { School } from "../fish/fish-systems/School";
import Squidger from "../fish/aggressive/Squidger";
import { DiveWatch } from "../hud/DiveWatch";
import { FishCounter } from "../hud/FishCounter";
import LightingManager from "../lighting/LightingManager";
import PauseMenu from "../menu/PauseMenu";
import { Anemone } from "../plants/Anemone";
import { UpgradeManager } from "../upgrade/UpgradeManager";
import { UpgradeShop } from "../upgrade/UpgradeShop";
import { VictoryScreen } from "../VictoryScreen";
import { WorldMap } from "../world/WorldMap";
import CameraController from "./CameraController";
import { DiverController } from "./DiverController";

/**
 * The top level control flow for the game, basically manages transitioning between menus and stuff
 */
export class GameController extends BaseEntity implements Entity {
  persistenceLevel = 2;
  id = "game_controller";

  handlers = {
    // Called at the beginning of the game
    newGame: () => {
      const game = this.game!;
      game.addEntity(new PauseMenu());
      game.addEntity(new LightingManager());
      game.addEntity(new Water());
      game.addEntity(new Sky());
      game.addEntity(new Boat());
      game.addEntity(new OceanAmbience());
      game.addEntity(new UpgradeManager());
      game.addEntity(new CameraController(game.camera));
      game.addEntity(new WorldMap());

      const diver = this.game!.addEntity(new Diver());

      // TODO: Readd damage overlay when it's better
      // game.addEntity(new DamagedOverlay(() => diver));
      game.addEntity(new DiverController(diver));
      game.addEntity(new DiveWatch(diver));
      game.addEntity(new FishCounter(diver));

      // TODO: Spawn these somewhere else
      game.addEntity(new Anemone(V(5, 10)));
      game.addEntity(new Anemone(V(-5, 15)));

      game.addEntity(new Squidger(V(-10, 5)));
      game.addEntity(new Squidger(V(-12, 6)));
      game.addEntity(new Squidger(V(-10, 7)));

      game.dispatch({ type: "diveStart" });
    },

    diveStart: () => {
      console.log("dive start");
      const diver = getDiver(this.game)!;
      diver.onBoat = true;
    },

    openShop: async () => {
      const diver = getDiver(this.game)!;
      diver.onBoat = true;
      if (!this.game?.entities.getById("upgradeShop")) {
        this.game?.addEntity(new UpgradeShop());
      }
    },

    diverDied: async () => {
      this.game?.addEntity(new SoundInstance(snd_musicalNope));
      await this.wait(3.0);
      this.game?.dispatch({ type: "diveStart" });
    },

    victory: async () => {
      const diver = getDiver(this.game);

      // hacky way to make sure we don't die...
      diver?.air.giveOxygen(10000);
      for (const fish of this.game!.entities.getByFilter(isFish)) {
        fish.destroy();
      }

      this.game!.addEntity(new VictoryScreen());
    },
  };
}
