<template>
    <div class="pure-g">
        <div class="pure-u-1">
            <scenario></scenario>
        </div>
    </div>
</template>

<script>
const Scenario = () => import('../components/scenario/ScenariiComponent.vue')
export default {
    components: { 
        Scenario 
    }
}
</script>