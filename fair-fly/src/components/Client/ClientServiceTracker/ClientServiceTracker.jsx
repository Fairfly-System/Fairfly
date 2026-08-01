import './service-tracker.css'
import { ChevronDown } from 'lucide-react';
import Steps from './Steps/Steps';
import {useState} from 'react';

export default function ClientServiceTracker({service}) {

    const [showSteps, setShowSteps] = useState(false);

    const toggleSteps = () => {
        setShowSteps(!showSteps);
    }

    //Test Data for steps
    const steps = [
        {
            status: `completed`,
            description: `Receive client information`
        },
        {
            status: `in-progress`,
            description: `Verify client information`
        },
        {
            status: `todo`,
            description: `Submit client information`
        }
    ]

    return (
        <div className="service-tracker">
            <div className="service-tracker-header">
                <div className="service-tracker-title">
                    <h2>{service.title}</h2>
                    <p>{service.dateRequested}</p>
                </div>
                <div className={`service-tracker-status ${service.status}`}> {service.status === `completed` ? `Complete ` : `In Progress`} </div>
            </div>

            <div className="service-tracker-progress">
                <div className="progress-bar-header">
                    <h3>Progress</h3>
                    <p>{service.progress}%</p>
                </div>
                <div className="progress-bar">
                    <div className="progress-bar-fill" style={{width: `${service.progress}%`}}></div>
                </div>
                <h3 className="estimated-completion">Estimated Completion: {service.estimatedCompletion}</h3>
            </div>
            <p className={`service-steps-show ${showSteps ? `active` : ``}`} onClick={toggleSteps}>
                <ChevronDown className="icon-chevron-down" />
                {!showSteps ? 
                    <>
                        Show Steps 
                    </>
                :
                    <>
                        Hide Steps
                    </>
                }
             </p>
            {showSteps ? <Steps steps={steps} /> : null}
        </div>
    )
}