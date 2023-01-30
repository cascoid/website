import {
  useTransform,
  transform,
  motion,
  useMotionValueEvent,
  useMotionValue,
} from "framer-motion";
import { usePageContext } from "./Base";
import { projects } from "../../../data/projects";
import Image from "next/image";
import { IconArrowNarrowRight } from "@tabler/icons";
import React from "react";
import { useRouter } from "next/router";
import { Button } from "../../Button";

const alignOptions = { start: 0, center: 0.5, end: 1 };

interface Props {
  index: number;
  onCurrent: React.Dispatch<React.SetStateAction<number>>;
}

const CarouselItem: React.FC<Props> = ({ index, onCurrent }) => {
  const router = useRouter();
  const {
    align,
    frameWidth: frameSize,

    trackSize,
    trackXOffset,
    viewWidth,
    viewHeight,
  } = usePageContext();

  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const onMouseMove = ({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const initialOffset = index * viewWidth;
  const alignOffset = (frameSize - viewWidth) * alignOptions[align];

  const startOffset = useTransform(trackXOffset, (value) => {
    let startOffset = initialOffset + value;

    while (startOffset > trackSize - viewWidth - alignOffset) {
      startOffset -= trackSize;
    }

    while (startOffset < 0 - viewWidth - alignOffset) {
      startOffset += trackSize;
    }

    return startOffset + alignOffset;
  });

  const normalOffset = useTransform(trackXOffset, (value) => {
    let startOffset = initialOffset + value;

    while (startOffset > trackSize - viewWidth - alignOffset) {
      startOffset -= trackSize;
    }

    while (startOffset < 0 - viewWidth - alignOffset) {
      startOffset += trackSize;
    }

    startOffset += alignOffset;

    const staticOffset = startOffset - alignOffset - trackXOffset.get();
    const getNormalOffset = transform(
      [-staticOffset - viewWidth, -staticOffset, -staticOffset + viewWidth],
      [-1, 0, 1]
    );
    return getNormalOffset(trackXOffset.get());
  });

  const opacity = useTransform(normalOffset, [-1, 0, 1], [0.6, 1, 0.6]);
  const scale = useTransform(normalOffset, [-1, 0, 1], [0.8, 1, 0.8]);

  useMotionValueEvent(scale, "change", (latest) => {
    if (latest > 0.9) {
      onCurrent(index);
    }
  });

  return (
    <motion.div
      style={{
        x: startOffset,
        y: 0,
        width: viewWidth,
        height: viewHeight,
        scale,
        opacity,
      }}
      onMouseMove={onMouseMove}
      className="absolute flex items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900 overflow-hidden"
    >
      <div className="relative flex items-center justify-center">
        <Image
          src={projects[index].coverImagePath}
          alt={projects[index].name + " cover image"}
          height={1920}
          width={1080}
          quality={100}
          className="max-w-none pointer-events-none"
        />
        <div className="h-full bg-gradient-to-t from-black to-black/0 w-full z-10 absolute">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Image
              src={projects[index].logoPath}
              alt={projects[index].name}
              width={48}
              height={48}
              quality={100}
              className="w-12 h-12 pointer-events-none"
            />
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold text-white">
                {projects[index].name} {index}
              </h1>
              <p className="text-neutral-400 text-lg font-medium">
                {projects[index].desc}
              </p>
            </div>
            <Button onClick={() => router.push("/work/" + projects[index].id)}>
              View Project
              <IconArrowNarrowRight height={16} width={16} />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CarouselItem;
