import type { Model } from "mongoose";
import { Broadcast } from "./Broadcast";
import { StoredFile } from "./File";
import { LoginAttempt } from "./LoginAttempt";
import { MailLog } from "./MailLog";
import { Member } from "./Member";
import { Message } from "./Message";
import { PageView, StatsDaily } from "./PageView";
import { Post } from "./Post";
import { Project } from "./Project";
import { Settings } from "./Settings";
import { Testimonial } from "./Testimonial";
import { User } from "./User";

/**
 * Every compiled model, for work that touches all collections at once —
 * building indexes in the seed and the rules check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ALL_MODELS: Model<any>[] = [
  Broadcast,
  StoredFile,
  LoginAttempt,
  MailLog,
  Member,
  Message,
  PageView,
  StatsDaily,
  Post,
  Project,
  Settings,
  Testimonial,
  User,
];
