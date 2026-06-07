import React from 'react';
import { BaseNode, type BaseWorkflowNode } from '../workflow/base-node';
import { type NodeProps } from '@xyflow/react';
import { Globe02Icon } from '@hugeicons/core-free-icons';

export function HttpNode(props: NodeProps<BaseWorkflowNode>) {
  return (
    <BaseNode 
      {...props} 
      data={{ 
        ...props.data, 
        kind: 'action',
        icon: Globe02Icon
      }} 
    />
  );
}
