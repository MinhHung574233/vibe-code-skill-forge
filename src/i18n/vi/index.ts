import { caro } from './caro';
import { caroHandbook } from './caroHandbook';
import { chess } from './chess';
import { common } from './common';
import { english } from './english';
import { go } from './go';
import { java } from './java';
import { rubik } from './rubik';
import { shell } from './shell';
import { tools } from './tools';
import { training } from './training';

/** All Vietnamese strings. Key = the exact English source string used in the code. */
export const VI: Readonly<Record<string, string>> = {
  ...common,
  ...shell,
  ...training,
  ...rubik,
  ...english,
  ...java,
  ...tools,
  ...caro,
  ...caroHandbook,
  ...chess,
  ...go,
};
