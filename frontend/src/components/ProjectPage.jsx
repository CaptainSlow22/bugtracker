import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProjectPage = () => {
    const { id } = useParams();
    

    return (
        <div>
            Project {id}
        </div>
    );
};

export default ProjectPage;
