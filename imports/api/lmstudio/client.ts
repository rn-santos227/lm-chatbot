import { Meteor } from "meteor/meteor";
import fetch from "node-fetch";

import type { LMRole } from "./type";
import { LMMessage } from "./type";

const lm = Meteor.settings.lmstudio;


