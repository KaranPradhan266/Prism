import { Link } from 'react-router-dom'; // assuming you're using React Router
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel'; // adjust path
import ProjectCard from './projectCard'; // adjust path

interface Project {
  id: string;
  name: string;
  path_prefix: string;
  updated_at: string;
  created_at: string;
  upstream_url: string;
  description?: string; // Make description optional since it might not exist in your data
  Status: string;
  // Remove type field conflict and add it properly if needed
}

interface ProjectCarouselProps {
  projects: Project[];
}

const ProjectCarousel = ({ projects }: ProjectCarouselProps) => {
  return (
    <Carousel opts={{ slidesToScroll: "auto" }}>
      <CarouselContent>
        {projects?.map(project => (
          <CarouselItem key={project.id} className="md:basis-1/2 lg:basis-1/3">
            <Link to={`/projects/${project.id}`} state={{ project }}>
              <ProjectCard project={project} />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default ProjectCarousel;