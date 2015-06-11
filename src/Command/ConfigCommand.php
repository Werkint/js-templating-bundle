<?php
namespace Werkint\Bundle\FrontendMapperBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Werkint\Bundle\FrontendMapperBundle\Service\PathsStorage;

/**
 * Дампит конфиг GULP
 *
 * @author Bogdan Yurov <bogdan@yurov.me>
 */
class ConfigCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this
            ->setName('werkint:frontendmapper:config');
    }

    /**
     * @inheritdoc
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $packages = $this->getPathsStorage()->getRegisteredPaths(PathsStorage::NS_BOWER);
        $packages = array_map(function (array $data) {
            return [
                'path' => $data['path'],
                'name' => $data['metadata']['name'],
            ];
        }, $packages);

        $output->write(json_encode([
            'root'   => './web',
            'path'   => './assets',
            'minify' => !$this->getContainer()->getParameter('kernel.debug'),
            'bower'  => [
                'target'   => 'bower_components',
                'packages' => $packages,
            ],

        ], JSON_PRETTY_PRINT));
    }

    /**
     * @return PathsStorage
     */
    protected function getPathsStorage()
    {
        return $this->getContainer()->get('werkint_frontend_mapper.pathsstorage');
    }
}