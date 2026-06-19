"use client"

import { motion, Variants } from "framer-motion"
import WorkFlowCard from "./workflow-card"
import { sileo } from "sileo"
import { Button } from "./ui/button"

interface WorkflowGridProps {
    workflows: {
        id: string
        name: string | null
        createdAt: Date
    }[]
}

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1]
        }
    }
}

export default function WorkflowGrid({ workflows }: WorkflowGridProps) {
    if (workflows.length === 0) {
        return <></>
    }

    return (
        <div className="flex items-center justify-center flex-col mt-10">
            <h1 className="text-center font-medium text-lg">Your Workflows</h1>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="flex flex-wrap mt-5 gap-5"
            >
                {workflows.map((workflow) => (
                    <motion.div key={workflow.id} variants={item}>
                        <WorkFlowCard
                            id={workflow.id}
                            name={workflow.name || "Untitled"}
                            createdAt={workflow.createdAt}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    )
}
