import React from 'react';
import { BaseNode, type BaseWorkflowNode } from '../workflow/base-node';
import { type NodeProps } from '@xyflow/react';
import { Mouse01Icon } from '@hugeicons/core-free-icons';

export function ManualNode(props: NodeProps<BaseWorkflowNode>) {
  return (
    <BaseNode 
      {...props} 
      data={{ 
        ...props.data, 
        kind: 'trigger',
        icon: Mouse01Icon
      }} 
    />
  );
}
