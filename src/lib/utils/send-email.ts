import React, { useState } from 'react';

export const sendEmail =  async (data: any) => {
    const apiEndpoint = '/api/email';

    try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        return result;
    } catch (error) {
        throw new Error('Error sending email');
    }
  };