export const HIT_PROVIDER = 'h';
export const LOGGER_PROVIDER = '7';

export const UNSUBSCRIBE_PROPERTY = 'u';

/**
 * Interface for extending providers in modules
 */
export interface PROVIDERS {
    HIT_PROVIDER: typeof HIT_PROVIDER;
    LOGGER_PROVIDER: typeof LOGGER_PROVIDER;
}

export type Provider = PROVIDERS[keyof PROVIDERS];

export type ProvidersMap<T> = {
    [provider in Provider]?: T;
};
