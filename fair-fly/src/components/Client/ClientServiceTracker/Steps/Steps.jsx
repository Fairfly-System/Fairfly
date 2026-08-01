import './steps.css'
import { CircleCheck, Loader, Circle  } from 'lucide-react'

export default function Steps({steps}) {

    return (
        <div className="steps-container">
            <div className="steps-header">
                <h3>Service Workflow Progress</h3>
            </div>
            
            {steps.map((step, index) => (
                <div className={`step-item ${step.status}`} key={index}>
                    <div className="step-item-header">
                        {
                            step.status === `completed` ? 
                            <CircleCheck className="icon-check icon" />
                            :
                            step.status === `in-progress` ? 
                            <Circle className="icon-circle icon" />
                            :
                            <Loader className="icon-loader icon" />
                        }
                        <p>{step.description}</p>
                    </div>
                    {step.status === `in-progress` ? <p className="step-item-progress">Current Step</p> : null}
                </div>

            ))}

        </div>
    )
}