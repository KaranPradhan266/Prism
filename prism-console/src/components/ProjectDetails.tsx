import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';

const ProjectDetails = () => {
  const location = useLocation();
  const { project } = location.state || {};

  if (!project) {
    return <div>Project not found.</div>;
  }

  const breadcrumbs = [
    { label: "Prism NGFW", href: "/dashboard" },
    { label: "Projects Dashboard", href: "/dashboard" },
    { label: project.name },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div>
        <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
        <p>{project.description}</p>
        <p>Path: {project.path_prefix}</p>
        <p>Status: {project.Status}</p>
        <p>Created at: {project.created_at}</p>
        <p>Updated at: {project.updated_at}</p>
        <p>Upstream URL: {project.upstream_url}</p>
      </div>
    </AppLayout>
  );
};

export default ProjectDetails;
