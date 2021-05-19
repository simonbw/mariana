import snd_musicalNope from "../../../resources/audio/ui/musical_nope.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { OceanAmbience } from "../audio/OceanAmbience";
import { Boat } from "../boat/Boat";
import { Diver, getDiver } from "../diver/Diver";
import { Water } from "../environment/Background";
import { Sky } from "../environment/Sky";
import { TimeOfDay } from "../environment/TimeOfDay";
import { isFish } from "../fish/BaseFish";
import { DamagedOverlay } from "../hud/DamagedOverlay";
import { DiveWatch } from "../hud/DiveWatch";
import { FishCounter } from "../hud/FishCounter";
import LightingManager from "../lighting/LightingManager";
import PauseMenu from "../menu/PauseMenu";
import { MilestoneManager } from "../upgrade/MilestoneManager";
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
      game.addEntity(new TimeOfDay());
      game.addEntity(new LightingManager());
      game.addEntity(new Sky());
      game.addEntity(new Water());
      game.addEntity(new OceanAmbience());
      game.addEntity(new UpgradeManager());
      game.addEntity(new MilestoneManager());
      game.addEntity(new Boat());
      game.addEntity(new CameraController(game.camera));
      game.addEntity(new WorldMap());

      const diver = this.game!.addEntity(new Diver());

      game.addEntity(new DamagedOverlay(() => diver));
      game.addEntity(new DiverController(diver));
      game.addEntity(new DiveWatch(diver));
      game.addEntity(new FishCounter(diver));

      game.dispatch({ type: "diveStart" });
    },

    diveStart: () => {
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
