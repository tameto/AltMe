import { ImageSourcePropType } from 'react-native';

import type { AvatarIcon } from '@/src/shared/types/user';

export const AVATAR_SOURCES: Record<string, ImageSourcePropType> = {
  robot: require('../../assets/avatars/av01-robot.png'),
  cat: require('../../assets/avatars/av02-cat.png'),
  bunny: require('../../assets/avatars/av03-bunny.png'),
  star: require('../../assets/avatars/av04-star.png'),
  owl: require('../../assets/avatars/av05-owl.png'),
  fox: require('../../assets/avatars/av06-fox.png'),
  penguin: require('../../assets/avatars/av07-penguin.png'),
  bear: require('../../assets/avatars/av08-bear.png'),
  dragon: require('../../assets/avatars/av09-dragon.png'),
  unicorn: require('../../assets/avatars/av10-unicorn.png'),
  panda: require('../../assets/avatars/av11-panda.png'),
  dolphin: require('../../assets/avatars/av12-dolphin.png'),
  phoenix: require('../../assets/avatars/av13-phoenix.png'),
  deer: require('../../assets/avatars/av14-deer.png'),
  koala: require('../../assets/avatars/av15-koala.png'),
  wolf: require('../../assets/avatars/av16-wolf.png'),
  hamster: require('../../assets/avatars/av17-hamster.png'),
  butterfly: require('../../assets/avatars/av18-butterfly.png'),
  jellyfish: require('../../assets/avatars/av19-jellyfish.png'),
  mushroom: require('../../assets/avatars/av20-mushroom.png'),
  crystal: require('../../assets/avatars/av21-crystal.png'),
  cloud: require('../../assets/avatars/av22-cloud.png'),
  moon: require('../../assets/avatars/av23-moon.png'),
  octopus: require('../../assets/avatars/av24-octopus.png'),
  flower: require('../../assets/avatars/av25-flower.png'),
  ghost: require('../../assets/avatars/av26-ghost.png'),
  slime: require('../../assets/avatars/av27-slime.png'),
  sakura: require('../../assets/avatars/av28-sakura.png'),
  flame: require('../../assets/avatars/av29-flame.png'),
  alien: require('../../assets/avatars/av30-alien.png'),
};

const LEGACY_FALLBACK: Record<string, string> = {
  default: 'robot',
  geometric: 'crystal',
  cosmic: 'star',
  organic: 'flower',
  tech: 'robot',
  zen: 'moon',
};

export function getAvatarSource(avatarIcon: AvatarIcon): ImageSourcePropType {
  const resolved = LEGACY_FALLBACK[avatarIcon] ?? avatarIcon;
  return AVATAR_SOURCES[resolved] ?? AVATAR_SOURCES.robot;
}
