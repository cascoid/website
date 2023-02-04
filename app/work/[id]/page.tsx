"use client";

import React from "react";
import Overview from "../../../components/work/project/Overview";
import { projects } from "../../../data/projects";

interface Props {
  params: { id: string };
}

const Project: React.FC<Props> = ({ params }) => {
  const { id } = params;

  const project = projects.find((project) => project.id === id);

  return <Overview project={project!} />;
};

export default Project;

export const generateStaticParams = async () => {
  return projects.map((project) => ({
    id: project.id,
  }));
};